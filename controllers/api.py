import tempfile

# Cloud-safe of uuid, so that many cloned servers do not all use the same uuids.
from gluon.utils import web2py_uuid

# Here go your api methods.
@auth.requires_signature()
def add_image():
    image_id = db.images.insert(
            image_url = request.vars.image_url
            )
    image = db.images( image_id )
    return response.json( dict( image=image ) )

def get_images():
    images = []
    # are_publics=0
    # are_privates=0
    # Create a bunch of data
    db_rows = db().select(db.images.ALL)
    for i, r in enumerate(db_rows):
        img = dict(
                # created_on = r.created_on,
                # created_by = r.created_by,
                image_url  = r.image_url,
        )
        images.append(img)

    return response.json(dict(
        # created_on = created_on,
        # created_by = created_by,
        images  = images
        )
    )


