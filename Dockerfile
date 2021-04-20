FROM unocha/nodejs:12

WORKDIR /srv/www

ADD package.json /srv/www/package.json

RUN yarn install

ADD . /srv/www

EXPOSE 4000

# CMD npm run dev
