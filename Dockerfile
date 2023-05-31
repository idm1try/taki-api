FROM node:18.16.0-alpine3.17 AS builder

WORKDIR /app

RUN npm install -g pnpm@latest

COPY package.json ./

COPY pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

FROM node:18.16.0-alpine3.17

WORKDIR /usr/share/app

RUN npm i -g pm2

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV production

EXPOSE 4000

CMD ["pm2-runtime", "dist/src/main.js"]

