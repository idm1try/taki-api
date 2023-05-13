FROM node:18.16.0-bullseye

WORKDIR /usr/src/app

RUN npm install -g pnpm@8.5.0

COPY package.json ./

COPY pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

ENV NODE_ENV production

CMD ["node", "dist/src/main.js"]

