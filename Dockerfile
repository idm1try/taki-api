FROM node:18.16.0-bullseye AS builder

WORKDIR /app

RUN npm install -g pnpm@8.5.0

COPY package.json ./

COPY pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

FROM node:18.16.0-bullseye

WORKDIR /usr/share/app

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV production

CMD ["node", "dist/src/main.js"]

