# ---- Steg 1: bygg klienten ----
FROM node:20-alpine AS clientbuild
WORKDIR /build
COPY client/package.json client/package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY client/ ./
RUN npm run build

# ---- Steg 2: server + färdig klient ----
FROM node:20-alpine
WORKDIR /app
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install --omit=dev --no-audit --no-fund
COPY server/ ./server/
COPY --from=clientbuild /build/dist ./client/dist

# Railway monterar volymer (/data) med root-ägarskap – containern körs därför som
# root så att uppladdningar kan skrivas till volymen. Railways isolering gäller per container.
RUN mkdir -p /data/uploads /app/server/logs

ENV NODE_ENV=production
WORKDIR /app/server
CMD ["node", "server.js"]
