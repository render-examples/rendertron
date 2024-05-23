FROM --platform=linux/amd64 node:10-slim


# # install chrome dependencies 
# RUN apt-get update && apt-get install -y wget gnupg
# RUN wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg && \
#   sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
#   apt-get update && \
#   apt-get install google-chrome-stable -y --no-install-recommends && \
#   rm -rf /var/lib/apt/lists/*


# Build the app
WORKDIR /app
COPY package*.json ./
RUN npm i


# Copy the app
COPY . ./
RUN npm run build

# Remove dev dependencies
ENV NODE_ENV=production
RUN npm prune
RUN rm -r ./src

RUN npm i puppeteer puppeteer-core

# Run the app
EXPOSE 3000
CMD ["npm", "run", "start"]