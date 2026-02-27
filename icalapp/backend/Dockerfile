FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY . .
RUN mkdir -p /app/data

ENV PORT=3000
EXPOSE 3000

CMD ["bun", "index.ts"]
