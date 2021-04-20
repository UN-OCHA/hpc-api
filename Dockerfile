FROM unocha/nodejs:12.20.1

WORKDIR /srv/www

ADD package.json /srv/www

RUN yarn install

ADD . /srv/www

EXPOSE 4000

CMD yarn run start