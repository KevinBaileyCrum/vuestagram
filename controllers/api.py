import tempfile

# Cloud-safe of uuid, so that many cloned servers do not all use the same uuids.
from gluon.utils import web2py_uuid

# Here go your api methods.
@auth.requires_signature()
def add_image():
    image_id = db.images.insert(
            image_url   = request.vars.image_url,
            image_price = request.vars.image_price
            )
    image = db.images( image_id )
    return response.json( dict( image=image ) )

@auth.requires_signature()
def get_user_images():
    images = []
    db_rows = db().select(db.images.ALL)
    a = auth.user
    for i, r in enumerate(db_rows):
        img = dict(
                created_on  = r.created_on,
                created_by  = r.created_by,
                image_url   = r.image_url,
                image_price = r.image_price,
        )
        # if( img.get(created_by) == a.user_id ):
        images.append(img)

    return response.json(dict(
        images  = images
        )
    )


@auth.requires_signature()
def get_images():
    id = request.vars.id
    images = db(db.images.created_by == id).select()
    return response.json(dict(
        images = images
    ))
    # images = []
    # db_rows = db().select(db.images.ALL)
    # for i, r in enumerate(db_rows):
    #     img = dict(
    #             created_on = r.created_on,
    #             created_by = r.created_by,
    #             image_url  = r.image_url,
    #     )
    #     images.append(img)

    # return response.json(dict(
    #     images  = images
    #     )
    # )

@auth.requires_signature()
def get_current_user():
    user = []
    r = auth.user
    usr = dict(
        first_name = r.first_name,
        last_name = r.last_name,
        email = r.email,
        user_id = r.id,
    )
    user.append( usr )

    return response.json(dict(
        user = user
        )
    )

@auth.requires_signature()
def get_users():
    logger.info('hello')
    users = []
    for r in db( db.auth_user.id != auth.user.id ).select():
        usr = dict(
            first_name = r.first_name,
            last_name = r.last_name,
            email = r.email,
            user_id = r.id,
        )
        users.append(usr)

    return response.json(dict(
        users = users
        )
    )





