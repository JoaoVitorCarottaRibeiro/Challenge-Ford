FROM node:22-bullseye-slim

RUN apt-get update && apt-get install -y libaio1 \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig*.json ./
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/
COPY apps/mobile/package.json ./apps/mobile/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --no-frozen-lockfile --ignore-scripts

COPY packages/database ./packages/database
RUN cd packages/database && pnpm build

COPY apps/api ./apps/api
RUN cd apps/api && pnpm build

EXPOSE 3333

CMD ["node", "apps/api/dist/index.js"]