FROM --platform=linux/amd64 node:20-bookworm-slim as release

# Install Google Chrome Stable
RUN apt-get update && apt-get install -y wget gnupg
RUN wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg && \
  sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
  apt-get update && \
  apt-get install google-chrome-stable -y --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

# Skip chromium download
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

# Insall dependencies first
COPY package*.json ./
RUN npm install

# Copy the app
COPY . ./
RUN npm run build

# Remove dev dependencies
ENV NODE_ENV=production
RUN npm prune
RUN rm -r ./src

# Run the app
ENV PORT=$PORT
EXPOSE $PORT

CMD ["npm", "run", "start"]