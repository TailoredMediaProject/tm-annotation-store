#!/bin/bash
set -e

echo "=== Try to createUser $MONGO_INITDB_USERNAME === "

mongo -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase "$rootAuthDatabase" "$MONGO_INITDB_DATABASE" <<EOF
db.createUser({
  user: '$MONGO_INITDB_USERNAME',
  pwd:  '$MONGO_INITDB_PASSWORD',
  roles: [{
    role: 'readWrite',
    db: '$MONGO_INITDB_DATABASE'
  }]
})
EOF

echo "=== User $MONGO_INITDB_USERNAME created === "
