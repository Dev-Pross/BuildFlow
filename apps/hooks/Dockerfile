FROM node:20-alpine as builder
RUN apk add --no-cache openssl


RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./

COPY packages/db  ./packages/db
COPY packages/kafka ./packages/kafka
COPY packages/typescript-config ./packages/typescript-config
COPY apps/hooks ./apps/hooks

RUN pnpm install --frozen-lockfile
RUN pnpm --filter hooks... build

FROM node:20-alpine as runner
RUN apk add --no-cache openssl

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/hooks ./apps/hooks
COPY --from=builder /app/package.json ./package.json

EXPOSE 8080
CMD [ "node", "apps/hooks/dist/index.js" ]