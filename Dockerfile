ARG buildImage=node:lts-alpine

FROM $buildImage as build-stage
WORKDIR /opt/app
RUN apk add --no-cache openjdk11
COPY . .
RUN npm ci --only=production
RUN npm run generate:build
RUN npm prune

FROM $buildImage as production-stage
RUN apk add --no-cache tini
WORKDIR /app/
COPY --from=build-stage /opt/app/dist .

ENV NODE_ENV=production
ENV MONGO_HOST=mongodb
ENV MONGO_DATABASE=annotations

USER node
EXPOSE 4000
ENTRYPOINT ["/sbin/tini", "--", "docker-entrypoint.sh", "server.js" ]
