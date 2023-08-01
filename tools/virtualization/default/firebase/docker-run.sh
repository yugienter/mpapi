#! /bin/bash

# apiコンテナ起動用スクリプト。

trap catch ERR

function catch {
  echo "[ERROR] (return code)=1 just before the command."
  exit 1
}

trap finally EXIT

function finally {
  echo "-- fin --"
  cd "${CURRENT_DIR}"
}

if [ $# -lt 1 ]; then
  echo "Too few arguments"
  echo "Usage: docker-run.sh [env name]"
  exit 1
fi

ENV_NAME="$1"
API_PROJECT_NAME=ma-platform-api
BASE_DIR=/opt/modules/firebase-emulator

cp ${BASE_DIR}/env/firebase.${ENV_NAME}.json ${BASE_DIR}/firebase.json

# mkdir -p ./tmp/db

firebase emulators:start --project ma-platform-local --import ./tmp/db --export-on-exit
