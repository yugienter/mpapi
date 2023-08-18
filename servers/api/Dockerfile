FROM nginx

COPY nginx.conf /etc/nginx/nginx.conf

RUN unlink /var/log/nginx/access.log
RUN unlink /var/log/nginx/error.log

EXPOSE 80




FROM node:18-alpine as staging

RUN apk add --no-cache libc6-compat

WORKDIR /usr/src/app

ENV NODE_ENV staging

# Create non-root user for Docker
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY package*.json ./

RUN npm install

COPY --chown=node:node . .

RUN cp .env.staging.local .env

RUN npm run build

USER nodejs

# CMD [ "node", "dist/main.js" ]
CMD ["npm", "run", "start:prod"]
