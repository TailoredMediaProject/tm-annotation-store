#!/bin/bash
set -e

echo "Executing init script started"

mongo -- $MONGO_INITDB_DATABASE <<EOF
db.createUser({
  user: '$MONGO_DB_USERNAME',
  pwd: '$MONGO_DB_PASSWORD',
  roles: [{
    role: 'readWrite',
    db: '$MONGO_INITDB_DATABASE'
  }]
})
EOF

echo "Executing init script finished"
