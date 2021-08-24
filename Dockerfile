FROM node:14-buster-slim

RUN apt-get update -q && apt-get install -y \
        tini \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
ENTRYPOINT [ "/usr/bin/tini", "--" ]

# Some node-tweaks
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin

# Let's go and package
WORKDIR /src/app
COPY package*.json ./

RUN npm install
#RUN npm ci --only=production

COPY . .
RUN npx tsc

ENV MONGO_HOST=mongodb

EXPOSE 4000
USER node
CMD [ "node", "dist/server.js" ]
