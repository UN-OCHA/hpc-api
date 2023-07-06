FROM public.ecr.aws/unocha/nodejs:18-alpine

ARG COMMIT_SHA
ARG TREE_SHA
ENV HPC_ACTIONS_COMMIT_SHA $COMMIT_SHA
ENV HPC_ACTIONS_TREE_SHA $TREE_SHA

ENV NODE_APP_DIR=/var/www/html
WORKDIR /var/www/html

COPY . .

RUN npm run install-and-link prod && \
  mv start_node /etc/services.d/node/run
