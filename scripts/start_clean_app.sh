#!/bin/bash
set -e

echo 'shutdown existing environment'
docker-compose down

echo 'remove docker data'
rm -rf .docker/mongodb/data

echo 'run mongo'
docker-compose --env-file .env.dev up -d
sleep 10

echo 'install dependencies'
npm i

echo 'run application'
npm start
