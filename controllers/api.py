import tempfile

# Here go your api methods.

# To do:
# Form checking (check that the form is not empty when a new track is added)
# User checking
# Sharing

# Let us have a serious implementation now.

def get_tracks():
    start_idx = int(request.vars.start_idx) if request.vars.start_idx is not None else 0
    end_idx = int(request.vars.end_idx) if request.vars.end_idx is not None else 0
    tracks = []
    has_more = False
    rows = db().select(db.track.ALL, limitby=(start_idx, end_idx + 1))
    for i, r in enumerate(rows):
        if i < end_idx - start_idx:
            # Check if I have a track or not.
            track_url = (
                URL('api', 'play_track', vars=dict(track_id=r.id), user_signature=True)
                if r.has_track else None)
            t = dict(
                id = r.id,
                artist = r.artist,
                album = r.album,
                title = r.title,
                num_plays = r.num_plays,
                track_url = track_url,
            )
            tracks.append(t)
        else:
            has_more = True
    logged_in = auth.user is not None
    return response.json(dict(
        tracks=tracks,
        logged_in=logged_in,
        has_more=has_more,
    ))

@auth.requires_signature()
def add_track():
    t_id = db.track.insert(
        artist = request.vars.artist,
        album = request.vars.album,
        title = request.vars.title,
        num_plays = 0
    )
    t = db.track(t_id)
    return response.json(dict(track=t))

@auth.requires_signature()
def del_track():
    "Deletes a track from the table"
    db(db.track.id == request.vars.track_id).delete()
    return "ok"

# NOTE that we cannot hash the variables, otherwise we cannot produce the URL server-side.
@auth.requires_signature(hash_vars=False)
def upload_track():
    "Uploads the file related to a track"
    logger.info("_signature: %r", request.vars._signature)
    track_id = int(request.vars.track_id)
    logger.info("Track id: %r", request.vars.track_id)
    # If I already have music for that track, delete it.
    db(db.track_data.track_id == track_id).delete()
    # Reads the bytes of the track.
    logger.info("Uploaded a file of type %r" % request.vars.file.type)
    if not request.vars.file.type.startswith('audio'):
        raise HTTP(500)
    db.track_data.insert(
        track_id=track_id,
        original_filename=request.vars.file.filename,
        data_blob=request.vars.file.file.read(),
        mime_type=request.vars.file.type,
    )
    db(db.track.id == track_id).update(has_track=True)
    return "ok"

@auth.requires_signature()
def delete_music():
    """Deletes the file associated with a track"""
    track_id = request.vars.track_id
    if track_id is None:
        raise HTTP(500)
    db(db.track_data.track_id == track_id).delete()
    db(db.track.id == track_id).update(has_track=False)
    return "ok"

@auth.requires_signature()
def play_track():
    track_id = int(request.vars.track_id)
    t = db(db.track_data.track_id == track_id).select().first()
    if t is None:
        return HTTP(404)
    headers = {}
    headers['Content-Type'] = t.mime_type
    # Web2py is setup to stream a file, not a data blob.
    # So we create a temporary file and we stream it.
    # f = tempfile.TemporaryFile()
    f = tempfile.NamedTemporaryFile()
    f.write(t.data_blob)
    f.seek(0) # Rewind.
    return response.stream(f.name, chunk_size=4096, request=request)

@auth.requires_signature()
def inc_plays():
    track_id = int(request.vars.track_id)
    t = db.track[track_id]
    t.update_record(num_plays = t.num_plays + 1)
    return "ok"
