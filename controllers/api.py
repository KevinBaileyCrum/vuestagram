# Here go your api methods.

import random

# Mocks implementation.
def get_tracks():
    start_idx = int(request.vars.start_idx) if request.vars.start_idx is not None else 0
    end_idx = int(request.vars.end_idx) if request.vars.end_idx is not None else 0
    # We just generate a lot of of data.
    tracks = []
    for i in range(start_idx, end_idx):
        t = dict(
            artist = random.choice(['IU', 'Ailee', 'T-ara', 'Mamamoo']),
            album = random.choice(['Modern times', 'Melting', 'Absolute']),
            title = random.choice(['Falling U', 'TTL', 'Piano Man']),
            num_plays = random.randint(0, 100),
        )
        tracks.append(t)
    has_more = True
    logged_in = False
    return response.json(dict(
        tracks=tracks,
        logged_in=logged_in,
        has_more=has_more,
    ))
