#!/bin/sh

set -e

USAGE="$(basename "$0") prod|ci|dev [-h]

Install the npm dependencies in this repository and perform any
neccesary symlink operations to use packages from these repos.

where:
    -h, --help        show this help text"

MODE=""

while [ "$1" != "" ]; do
  case $1 in
    prod )          shift
                    MODE='prod'
                    ;;
    ci )            shift
                    MODE='ci'
                    ;;
    dev )           shift
                    MODE='dev'
                    ;;
    -h | --help )   echo "$USAGE"
                    exit
                    ;;
  esac
done

if [ "$MODE" = "" ]; then
  echo "An install mode must be specified, e.g: npm run install-and-link dev"
  exit 1
fi

DIR_TO_GO_BACK=$(pwd -P)

echo "Installing dependencies for hpc-api"
if [ "$MODE" = "prod" ]; then
  yarn install --production
else
  yarn install
fi

if [ "$MODE" = "dev" ]; then
  echo "Linking @unocha/hpc-api-core to ../hpc-api-core"
  rm -rf "node_modules/@unocha/hpc-api-core"
  ln -s "../../../hpc-api-core" "node_modules/@unocha/hpc-api-core"
fi

cd $DIR_TO_GO_BACK
