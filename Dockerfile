# Build Stage
FROM node:alpine AS builder

WORKDIR /build

COPY package*.json ./

RUN npm install

COPY --chown=node:node . .

RUN npm run build


# Production Stage
FROM node:alpine

ENV API_SERVER="http://localhost:80"
ENV ID_URL="https://localhost:443"
ENV ETHERSCAN_KEY=""
ENV BINANCE_KEY=""
ENV BINANCE_SECRET=""

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

USER node

COPY --from=builder --chown=node:node /build/dist/src ./src

COPY --from=builder --chown=node:node /build/package*.json ./

RUN npm install --only=prod

ENTRYPOINT [ "node", "src/index.js" ]