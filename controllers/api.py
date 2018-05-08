import tempfile

# Cloud-safe of uuid, so that many cloned servers do not all use the same uuids.
from gluon.utils import web2py_uuid

# Here go your api methods.

# To do:
# Form checking (check that the form is not empty when a new track is added)
# User checking
# Sharing

# Let us have a serious implementation now.

def build_track_url(i):
    return URL('api', 'play_track', vars=dict(track_id=i), user_signature=True)

@auth.requires_signature()
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
                track_url =  build_track_url(r.id),
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
def get_insertion_id():
    insertion_id = web2py_uuid()
    return response.json(dict(
        insertion_id=insertion_id
    ))

@auth.requires_signature()
def add_track():
    """Received the metadata for a new track."""
    # Inserts the track information.
    t_id = db.track.insert(
        artist = request.vars.artist,
        album = request.vars.album,
        title = request.vars.title,
        num_plays = 0
    )
    # Then, updates the uploaded track to point to this track.
    db(db.track_data.id == request.vars.insertion_id).update(track_id=t_id)
    # Also, to clean up, remove tracks that do not belong to anyone.
    db(db.track_data.track_id == None).delete()
    # Returns the track info.  Building the dict should likely be done in
    # a shared function, but oh well.
    return response.json(dict(track=dict(
        id = t_id,
        artist = request.vars.artist,
        album = request.vars.album,
        title = request.vars.title,
        num_plays = 0,
        track_url = build_track_url(t_id)
    )))

@auth.requires_signature()
def del_track():
    "Deletes a track from the table"
    db(db.track.id == request.vars.track_id).delete()
    # The next line is likely useless, as this is taken care by SQL deletion cascading.
    db(db.track_data.track_id == request.vars.track_id).delete()
    return "ok"

# NOTE that we cannot hash the variables, otherwise we cannot produce the URL server-side.
@auth.requires_signature()
def upload_track():
    "Uploads the file related to a track"
    logger.info("_signature: %r", request.vars._signature)
    logger.info("Track insertion id: %r", request.vars.insertion_id)
    # First, we delete other incomplete uploads.
    db(db.track_data.track_id == None).delete()
    logger.info("Uploaded a file of type %r" % request.vars.file.type)
    if not request.vars.file.type.startswith('audio'):
        raise HTTP(500)
    # Inserts the new track.
    insertion_id = db.track_data.insert(
        track_id=None, # We don't know it yet.
        original_filename=request.vars.file.filename,
        data_blob=request.vars.file.file.read(),
        mime_type=request.vars.file.type,
        insertion_id=request.vars.insertion_id,
    )
    return response.json(dict(
        insertion_id=insertion_id
    ))

@auth.requires_signature()
def cleanup():
    """Removes incomplete uploads."""
    db(db.track_data.track_id == None).delete()


@auth.requires_signature()
def delete_music():
    """Deletes the file associated with a track, as we have uploaded a new one."""
    track_id = request.vars.track_id
    if track_id is None:
        raise HTTP(500)
    db(db.track_data.track_id == track_id).delete()
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
