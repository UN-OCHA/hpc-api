FROM node:14.16.0-alpine3.11

WORKDIR /usr/src/app

COPY . .

RUN yarn install

EXPOSE 4000

CMD yarn run dev
