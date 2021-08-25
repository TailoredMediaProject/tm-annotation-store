#!/bin/bash
set -e

echo "=== Try to createUser $MONGO_USERNAME === "

mongo -u "$MONGO_ROOT_USERNAME" -p "$MONGO_ROOT_PASSWORD" --authenticationDatabase "$rootAuthDatabase" "$MONGO_DATABASE" <<EOF
db.createUser({
  user: '$MONGO_USERNAME',
  pwd:  '$MONGO_PASSWORD',
  roles: [{
    role: 'readWrite',
    db: '$MONGO_DATABASE'
  }]
})
EOF

echo "=== User $MONGO_USERNAME created === "
