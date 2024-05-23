# ****************
# Installer
# ****************
FROM --platform=linux/amd64 node:10.24.1-slim as installer
WORKDIR /app

# Insall dependencies
COPY package*.json ./
RUN npm i

# ****************
# Build and Serve
# ****************
FROM --platform=linux/amd64 node:10.24.1-slim as release
WORKDIR /app

# Copying all the contents from previous stage(used - - from) into current stage
COPY --from=installer /app /app/

# Copy the app
COPY . ./
RUN npm run build

# Remove dev dependencies
ENV NODE_ENV=production
RUN npm prune
RUN rm -r ./src


# Run the app
EXPOSE 3000
CMD ["npm", "run", "start"]