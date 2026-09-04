FROM node:20-alpine

RUN npm install -g browser-sync@2.29.3

WORKDIR /app

USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -q --spider http://127.0.0.1:8080/ || exit 1

CMD ["browser-sync", "start", "--config", "/app/browser-sync.config.js"]
