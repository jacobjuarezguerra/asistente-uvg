FROM node:24-alpine
WORKDIR /app
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --chown=node:node server.cjs ./
COPY --chown=node:node lib ./lib
COPY --chown=node:node assets ./assets
COPY --chown=node:node js ./js
COPY --chown=node:node data ./data
COPY --chown=node:node index.html ./
USER node
ENV HOST=0.0.0.0 PORT=8765
EXPOSE 8765
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:8765/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server.cjs"]
