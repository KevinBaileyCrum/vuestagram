# Define your tables below (or better in another model file) for example
#
# >>> db.define_table('mytable', Field('myfield', 'string'))
#
# Fields can be 'string','text','password','integer','double','boolean'
#       'date','time','datetime','blob','upload', 'reference TABLENAME'
# There is an implicit 'id integer autoincrement' field
# Consult manual for more options, validators, etc.

import datetime

def get_user_email():
    return auth.user.email if auth.user else None


db.define_table('images',
                # Field('user_email', default=get_user_email()),
                # Field('title'),
                # Field('memo', 'text'),
                # Field('is_public', 'boolean', default=False),
                # Field('updated_on', 'datetime', update=datetime.datetime.utcnow())
                Field('created_on', 'datetime', default=request.now),
                Field('created_by', 'reference auth_user', default=auth.user_id),
                Field('image_url')
)

# db.images.user_email.writable = False
# db.images.user_email.readable = False
# db.images.updated_on.writable = db.images.updated_on.readable = False
# db.images.id.writable = db.images.id.readable = False

# after defining tables, uncomment below to enable auditing
# auth.enable_record_versioning(db)
