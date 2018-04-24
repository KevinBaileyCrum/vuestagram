# Here go your api methods.

# Let us have a serious implementation now.

def get_tracks():
    start_idx = int(request.vars.start_idx) if request.vars.start_idx is not None else 0
    end_idx = int(request.vars.end_idx) if request.vars.end_idx is not None else 0
    tracks = []
    has_more = False
    rows = db().select(db.track.ALL, limitby=(start_idx, end_idx + 1))
    for i, r in enumerate(rows):
        if i < end_idx - start_idx:
            t = dict(
                id = r.id,
                artist = r.artist,
                album = r.album,
                title = r.title,
                num_plays = r.num_plays,
                track_url = None,
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
    return "ok"

@auth.requires_signature()
def delete_music():
    """Deletes the file associated with a track"""
    db(db.track_data.track_id == request.vars.track_id).delete()
    return "ok"