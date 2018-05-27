import tempfile

# Cloud-safe of uuid, so that many cloned servers do not all use the same uuids.
from gluon.utils import web2py_uuid

# Here go your api methods.
@auth.requires_signature()
def add_image():
    image_id = db.images.insert(
            image_url= request.vars.image_url
            )
    image = db.images( image_id )
    return response.json( dict( image=image) )

