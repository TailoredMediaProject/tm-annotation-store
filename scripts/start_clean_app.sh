#!/bin/bash
set -e

echo 'shutdown existing environment'
docker-compose down

echo 'run environment'
docker-compose up -d

sleep 10

echo 'init kafka'

function init_kafka() {
  npm i
  node init_kafka.js
}
(cd ./node && init_kafka)

echo 'install dependencies'
npm i

echo 'run application'
npm run build:start # Does not run nodemon for local development!
