FROM node:24.22.0-bookworm-slim@sha256:a5f4366e834695d5f363b920c104953a535d3a9864d1bdf74566a0ebe01daee5
RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl ca-certificates libnss3 libatk1.0-0 libatk-bridge2.0-0 \
    libx11-6 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 \
    libgbm1 libdrm2 libxcb1 libxkbcommon0 libasound2 libglib2.0-0 \
    libcups2 libdbus-1-3 libpango-1.0-0 libcairo2 fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
RUN npm install --global npm@11.17.0 \
    && mkdir -p /workspace/node_modules /home/node/.npm \
    && chown -R node:node /workspace /home/node/.npm
USER node
WORKDIR /workspace
CMD ["sleep", "infinity"]
