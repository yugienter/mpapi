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
BASE_DIR=/opt/modules/api

cp ${BASE_DIR}/env/.env.${ENV_NAME} ${BASE_DIR}/.env

DEPLOY_DATE_STR=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "" >> ${BASE_DIR}/.env
echo "APP_LAST_UPDATE_DATETIME=${DEPLOY_DATE_STR}" >> ${BASE_DIR}/.env
if [ "$(cat ~/.bashrc | grep '<<< Login Scripts >>>' || echo '')" = '' ]; then
  echo "# <<< Login Scripts >>>" >> ~/.bashrc
  echo "echo '---------------------------------'" >> ~/.bashrc
  echo "echo '--- Project: ${API_PROJECT_NAME}'" >> ~/.bashrc
  echo "echo '--- DT     : ${DEPLOY_DATE_STR}'" >> ~/.bashrc
  echo "echo '--- Env    : ${ENV_NAME}'" >> ~/.bashrc
  echo "echo '---------------------------------'" >> ~/.bashrc
fi

touch yarn.lock.docker

RESULT=`diff yarn.lock yarn.lock.docker || echo 'D'`

if [ ! "$RESULT" = "" ]; then
  echo 'installing packages...'
  yarn
  cp yarn.lock yarn.lock.docker
fi
if [ "${ENV_NAME}" = "local-docker" ]; then
  echo 'building resources...'
  yarn run build
fi

echo 'starting API server...'

node ./dist/main

echo '*** docker-run: ok ***'
