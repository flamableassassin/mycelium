FROM node:16-alpine

WORKDIR /app

ENV NODE_ENV="production"

COPY package*.json ./

RUN npm install --production

COPY ./prisma /app/prisma

RUN npx prisma generate

COPY . /app

CMD [ "npm","start" ]