FROM node:14

WORKDIR /app

COPY package*.json ./

RUN npm install --production

RUN npm install -g prisma

COPY /prisma ./prisma

RUN prisma generate

COPY . /app

ENV NODE_ENV="production"

CMD [ "npm","start" ]