ARG buildImage=node:16.18.1-alpine3.16

FROM $buildImage as build-stage
WORKDIR /opt/app
RUN apk add --no-cache openjdk11 curl
COPY ./ ./
# RUN npm ci --only=production, # openapi-generator makes problems here
RUN npm i
RUN npm run package
# RUN npm prune

FROM $buildImage as production-stage
RUN apk add --no-cache tini
WORKDIR /app/
COPY --from=build-stage /opt/app/dist .

ENV NODE_ENV=production
# prod: mongodb, local for testing: localhost, just comment the next line
ENV MONGO_HOST=mongodb
ENV MONGO_DATABASE=annotations

USER node
EXPOSE 4000
ENTRYPOINT ["/sbin/tini", "--", "docker-entrypoint.sh", "server.js" ]
# ENTRYPOINT [ "sh", "-c", "while true; do sleep 20; done"]
