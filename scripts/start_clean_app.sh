#!/bin/bash
set -e

echo 'shutdown existing environment'
docker-compose --env-file ../.env.dev down

echo 'remove docker data'
rm -rf ../.docker/mongodb/data/*
mkdir -p ../.docker/mongodb/data ../.docker/mongodb/data/db ../.docker/mongodb/data/log

echo 'run environment'
docker-compose --env-file .env.dev up -d


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
npm run build:start
