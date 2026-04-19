FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm config set registry https://registry.npmjs.org/ \
 && npm install --omit=dev --legacy-peer-deps --no-audit --no-fund

COPY . .

ENV NODE_ENV=production
EXPOSE 3001

USER node

CMD ["npm", "start"]
