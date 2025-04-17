FROM node:22-alpine

ENV NODE_ENV production

WORKDIR /app
COPY package*.json ./
COPY databases ./databases
RUN npm ci --omit-dev
COPY build ./build

COPY ./bin/app.sh ./app.sh
COPY ./bin/analyze.sh ./analyze.sh
COPY ./bin/collect.sh ./collect.sh

ENTRYPOINT [ "./app.sh" ]
