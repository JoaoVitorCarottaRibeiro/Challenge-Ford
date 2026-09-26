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

# NODE_ENV=production explícito na imagem: sem isso, o guard de `synchronize`
# em packages/database/src/data-source.ts (só roda auto-DDL fora de production)
# não tinha efeito nenhum dentro do container — dependia da plataforma de
# deploy setar a variável por conta própria, o que nem toda PaaS faz.
ENV NODE_ENV=production

# Roda como usuário não-root — a imagem base node:*-bullseye já vem com o
# usuário `node` (uid 1000) pronto; só falta dar posse do diretório da app.
RUN chown -R node:node /app
USER node

EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3333/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "apps/api/dist/index.js"]
