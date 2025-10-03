#!/bin/bash

TAG="template/template-back:latest"

if [[ $1 != "" ]]; then
  TAG=$1
fi

docker build --tag ${TAG} .