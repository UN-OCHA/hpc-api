FROM node:14.16.0-alpine3.11

WORKDIR /app

ADD package.json /app 

RUN yarn install

ADD . /app 

EXPOSE 4000

CMD yarn run start
