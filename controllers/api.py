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
    db(db.track.id == request.vars.track_id).delete()
    return "ok"
