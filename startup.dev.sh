#!/usr/bin/env bash
set -e

/opt/wait-for-it.sh mysql:3306
npm run migration:run
npm run seed:run
npm run start:prod
