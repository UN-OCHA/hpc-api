# TODO: Amend for production

FROM public.ecr.aws/unocha/nodejs:12-alpine

RUN apk add -U build-base python3 py-pip

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.2.1/wait /wait
RUN chmod +x /wait
