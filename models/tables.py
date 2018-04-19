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

db.define_table('track',
                Field('artist'),
                Field('album'),
                Field('title'),
                Field('num_plays', 'integer'),
                Field('created_by', default=get_user_email()),
                Field('created_on', default=datetime.datetime.utcnow()),
                )


# after defining tables, uncomment below to enable auditing
# auth.enable_record_versioning(db)
