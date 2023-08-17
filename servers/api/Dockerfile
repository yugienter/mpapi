#
# 🧑‍💻 Staging
#
FROM node:18-alpine as staging
# add the missing shared libraries from alpine base image
RUN apk add --no-cache libc6-compat
# Create app folder
# WORKDIR /app

WORKDIR /user/src/app

# Set to dev environment
ENV NODE_ENV staging

# Create non-root user for Docker
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy source code into app folder
COPY --chown=node:node . .

# Install dependencies
RUN npm install

RUN cp .env.staging.local .env

RUN npm run build

# Set Docker as a non-root user
USER nodejs

CMD ["npm", "run", "start:prod"]
