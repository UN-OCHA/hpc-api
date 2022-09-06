#!/usr/bin/env bash

usage="$(basename "$0") [-h] [-u username] [-e env] [-k]
where:
    -h  show this help text
    -u  username to connect through Sesame
    -l  skip scp connection and use local dump instead
    -e  set the env (stage or prod, default: stage)
    -p  Sesame password"


#set default vars
BACKUP=0
DISTANT_DUMP_NAME='latest.pg_restore'
DISTANT_ENV='prod'
KEEP_DB=0
PASSWORD=''
TIMESTAMP=`date +%Y-%m-%d.%H:%M:%S`
USE_LOCAL_DUMP=0
USERNAME=$USER

DB_DUMP="hpc-$DISTANT_ENV-$TIMESTAMP.sql"

#typical usage: ./bin/sync-db.sh -u vincenth -e prod
while [ "$1" != "" ]; do
  case $1 in
    -u | --username )     shift
                          USERNAME=$1
                          ;;
    -p | --password )     shift
                          PASSWORD=$1
                          ;;
    -d | --dump-name )    shift
                          DISTANT_DUMP_NAME=$1
                          DB_DUMP=$1
                          ;;
    -e | --environment )  shift
                          DISTANT_ENV=$1
                          ;;
    -l | --local )        USE_LOCAL_DUMP=1
                          ;;
    -h | --help )         echo "$usage"
                          exit
                          ;;
    * )                   echo "$usage"
                          exit 1
  esac
  shift
done

PG_CONTAINER=$(docker-compose ps | grep db | awk '{ print $1 }')
if [[ $(docker inspect -f {{.State.Running}} $PG_CONTAINER) == 'false' ]]; then
  echo "Your Docker environment is not running. Please start it before running this script."
  exit 1
fi

SCRIPT_DIR=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
BACKUP_PATH="backups/$DISTANT_ENV"
BACKUP_DIR="$SCRIPT_DIR/../$BACKUP_PATH"

PG_DB_NAME=$(docker exec $PG_CONTAINER printenv POSTGRES_DB)

echo "$PG_DB_NAME"

if [ $USE_LOCAL_DUMP -eq 0 ]; then
  if [ "${#PASSWORD}" -eq 0 ]; then
    echo -n "Type in your Sesame password and press enter to continue: ";
    read -s PASSWORD;
  fi
  echo "Obtaining an authentication token for snapshot access"
  # `--quiet` is used to avoid wget being verbose while fetching the token, because we only need JSON response
  # `–output-document`` (-O) option is used to redirect the content to a file of our choice.
  # As a particular use case, if we use – as the file, so that output is directed to stdout
  # JSON response is fed to `jq` to extract access token, which is then stripped of quotes with `tr`
  TOKEN=$(wget --post-data "grant_type=password&client_id=token&username=${USERNAME}&password=${PASSWORD}" --quiet -O - https://auth.ahconu.org/oauth2/token | jq '.access_token' | tr -d '"')

  if [ -z "${TOKEN}" ]; then
    echo -e "Unable to obtain an authentication token\n"
    echo "Please check that your credentials are correct. When running the script, wrap your password in single quotes, i.e. ./sync-db.sh -p 'P@\$\$w0rd'"
    if [ "$USER" == "$USERNAME" ]; then
      echo "Note that username for Sesame authentication defaults to your local machine username $USER, if you don't provide it with -u flag."
    fi
    exit 1
  fi

  echo "Copying $DISTANT_ENV HPC DB snapsnot to local, using wget with token authentication"
  wget --header="Authorization: Bearer ${TOKEN}" https://snapshots.aws.ahconu.org/hpc-sync/$DISTANT_ENV/$DISTANT_DUMP_NAME -O "$BACKUP_DIR/$DB_DUMP" || { echo 'Copying database from source failed' ; exit 1; }
  ln -sf "$BACKUP_DIR/$DB_DUMP" "$BACKUP_DIR/latest.pg_restore"
else
  echo "Using previous backup of local database"
  DB_DUMP="latest.pg_restore"  
fi

echo "Ensure database $PG_DB_NAME exists"
docker exec -i $PG_CONTAINER psql -U demo -c "SELECT 1 FROM pg_database WHERE datname = '$PG_DB_NAME'" | \
  grep -q 1 || docker exec -i $PG_CONTAINER psql -U demo -c "CREATE DATABASE $PG_DB_NAME"

echo "Remove and recreate DB"
echo "$PG_CONTAINER"
docker exec -i $PG_CONTAINER psql -U demo -c "\
DROP SCHEMA public CASCADE; \
  CREATE SCHEMA public; \
  GRANT USAGE ON SCHEMA public to demo; \
GRANT CREATE ON SCHEMA public to demo;" $PG_DB_NAME

echo "Restore DB $DB_DUMP to $PG_DB_NAME"
pwd
docker exec -i $PG_CONTAINER pg_restore -v -j 4 -U demo -O -d $PG_DB_NAME backups/$DISTANT_ENV/$DB_DUMP
if [[ $(docker inspect -f {{.State.Running}} $PG_CONTAINER) == 'true' ]]; then
  # Keep only the 5 most recent database backups.
  docker exec -it $PG_CONTAINER sh -c "cd /backups/$DISTANT_ENV && ls -tr | grep '^hpc-$DISTANT_ENV-.*\.sql$' | head -n -5 | xargs rm -f"
fi

# Install extension locally.
docker exec -it $PG_CONTAINER psql -U demo -c 'CREATE EXTENSION IF NOT EXISTS unaccent;' demo
