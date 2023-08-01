FROM ubuntu:20.04 AS base

ARG NODE_VERSION=16

ENV DEBIAN_FRONTEND=noninteractive

RUN apt update && apt install -y --no-install-recommends \
    build-essential \
    cmake \
    git \
    wget \
    curl \
    openssl \
    ca-certificates \
    libssl-dev \
    language-pack-ja \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

RUN update-locale LANG=ja_JP.UTF-8 LC_ALL=ja_JP.UTF-8 LANGUAGE=ja_JP.UTF-8 LC_CTYPE=ja_JP.UTF-8
RUN rm /etc/localtime && echo "Asia/Tokyo" > /etc/timezone
RUN dpkg-reconfigure -f noninteractive tzdata

WORKDIR /opt/initialization

# Node & Yarn
RUN curl -sL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
RUN apt install -y nodejs

RUN npm install --global yarn

# その他ツールのインストールはここ。
RUN apt update && apt install -y --no-install-recommends \
    mysql-client \
    zip \
    unzip \
    vim \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m ubuntu -s /bin/bash

ENV NODE_OPTIONS="--max-old-space-size=4096"

WORKDIR /opt/modules

# ++++++++++ LOCAL ++++++++++
FROM base AS local

# ++++++++++ DEV ++++++++++
FROM base AS dev
ARG API_PROJECT_NAME=api
ARG API_PROJECT_DIR=/opt/modules/${API_PROJECT_NAME}
ARG API_TMP_PROJECT_DIR=dev/tmp/servers/${API_PROJECT_NAME}

# ./tmpにgit cloneした内容について、ライブラリだけ先にインストールしてキャッシュを作り、それから全部突っ込む。

# Install libs (frontend)
ADD ${API_TMP_PROJECT_DIR}/package.json /opt/initialization/package.json
ADD ${API_TMP_PROJECT_DIR}/yarn.lock /opt/initialization/yarn.lock
WORKDIR /opt/initialization
RUN . ~/.bashrc && yarn config set network-timeout 600000 && yarn

# Add resources & mv installed libraries (frontend)
ADD ${API_TMP_PROJECT_DIR} ${API_PROJECT_DIR}
RUN mv /opt/initialization/node_modules ${API_PROJECT_DIR}/node_modules
WORKDIR ${API_PROJECT_DIR}

RUN cp yarn.lock yarn.lock.docker
RUN . ~/.bashrc && yarn build

ADD default/api/docker-run.sh /usr/local/src/docker-run.sh

CMD /usr/local/src/docker-run.sh dev

WORKDIR ${API_PROJECT_DIR}

# ++++++++++ STAGING ++++++++++
FROM base AS stg
ARG API_PROJECT_NAME=api
ARG API_PROJECT_DIR=/opt/modules/${API_PROJECT_NAME}
ARG API_TMP_PROJECT_DIR=stg/tmp/servers/${API_PROJECT_NAME}

# ./tmpにgit cloneした内容について、ライブラリだけ先にインストールしてキャッシュを作り、それから全部突っ込む。

# Install libs (frontend)
ADD ${API_TMP_PROJECT_DIR}/package.json /opt/initialization/package.json
ADD ${API_TMP_PROJECT_DIR}/yarn.lock /opt/initialization/yarn.lock
WORKDIR /opt/initialization
RUN . ~/.bashrc && yarn config set network-timeout 600000 && yarn

# Add resources & mv installed libraries (frontend)
ADD ${API_TMP_PROJECT_DIR} ${API_PROJECT_DIR}
RUN mv /opt/initialization/node_modules ${API_PROJECT_DIR}/node_modules
WORKDIR ${API_PROJECT_DIR}

RUN cp yarn.lock yarn.lock.docker
RUN . ~/.bashrc && yarn build

# ビルド失敗でresourcesが存在しないケースがあったので一応
RUN test -d dist/resources

ADD default/api/docker-run.sh /usr/local/src/docker-run.sh

CMD /usr/local/src/docker-run.sh stg

WORKDIR ${API_PROJECT_DIR}

# ++++++++++ PRODUCTION ++++++++++
FROM base AS production

ARG API_PROJECT_NAME=api
ARG API_PROJECT_DIR=/opt/modules/${API_PROJECT_NAME}
ARG API_TMP_PROJECT_DIR=production/tmp/servers/${API_PROJECT_NAME}

# ./tmpにgit cloneした内容について、ライブラリだけ先にインストールしてキャッシュを作り、それから全部突っ込む。

# Install libs (frontend)
ADD ${API_TMP_PROJECT_DIR}/package.json /opt/initialization/package.json
ADD ${API_TMP_PROJECT_DIR}/yarn.lock /opt/initialization/yarn.lock
WORKDIR /opt/initialization
RUN . ~/.bashrc && yarn config set network-timeout 600000 && yarn

# Add resources & mv installed libraries (frontend)
ADD ${API_TMP_PROJECT_DIR} ${API_PROJECT_DIR}
RUN mv /opt/initialization/node_modules ${API_PROJECT_DIR}/node_modules
WORKDIR ${API_PROJECT_DIR}

RUN cp yarn.lock yarn.lock.docker
RUN . ~/.bashrc && yarn build

# ビルド失敗でresourcesが存在しないケースがあったので一応
RUN test -d dist/resources

ADD default/api/docker-run.sh /usr/local/src/docker-run.sh

CMD /usr/local/src/docker-run.sh production

WORKDIR ${API_PROJECT_DIR}

