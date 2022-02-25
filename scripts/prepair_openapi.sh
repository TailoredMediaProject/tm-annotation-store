#!/bin/sh
set -e

destDir="./dist/static"
destFile="./dist/static/spec.yaml"

if [ ! -f "$destFile" ]; then
  mkdir -p $destDir
  curl -o $destFile https://raw.githubusercontent.com/TailoredMediaProject/tm-annotation-store-api/master/api/resource/spec.yaml
fi
