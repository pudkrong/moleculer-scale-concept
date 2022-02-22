#!/usr/bin/env bash

TRAEFIK="$PWD/scripts/traefik"
if [[ ! -e $TRAEFIK ]]; then
  TARGET="$PWD/scripts/traefik.tar.gz"
  curl https://github.com/traefik/traefik/releases/download/v2.6.1/traefik_v2.6.1_darwin_amd64.tar.gz -L -o $TARGET
  tar xzvf $TARGET -C $PWD/scripts
fi

$TRAEFIK --configFile=$PWD/scripts/traefik.yml

# docker run -it -p 8080:8080 -p 3000:80 -v $PWD/traefik.yml:/etc/traefik/traefik.yml traefik:v2.6