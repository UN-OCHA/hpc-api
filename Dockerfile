FROM node:10.22.1-alpine3.11

WORKDIR /usr/src/app

COPY . .

RUN yarn install

EXPOSE 4000

CMD yarn start