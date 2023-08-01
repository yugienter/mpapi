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
    openjdk-16-jre-headless \
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
RUN npm install -g firebase-tools
RUN firebase setup:emulators:firestore
RUN firebase setup:emulators:storage
RUN firebase setup:emulators:ui

# その他ツールのインストールはここ。
RUN apt update && apt install -y --no-install-recommends \
    zip \
    unzip \
    vim \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m ubuntu -s /bin/bash

WORKDIR /opt/modules

# ++++++++++ LOCAL ++++++++++
FROM base AS local

# ++++++++++ DEV ++++++++++
FROM base AS dev
# TODO

# ++++++++++ STAGING ++++++++++
FROM base AS stg
# TODO

# ++++++++++ PRODUCTION ++++++++++
FROM base AS production
# TODO
