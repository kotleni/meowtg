FROM node:20-alpine
WORKDIR /app
COPY . .

ENV NODE_ENV=production
RUN npm install
CMD ["npm", "run", "prod"]