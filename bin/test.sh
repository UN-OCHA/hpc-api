root=$(pwd)

#Global variables
USAGE='Usage: test.sh [options] [-- [options]].\n Options:\n   -oc, --only-containers: only start docker containers\n    -sc, --stop-containers: stop docker containers\n    -k, --keep: keep jest runing after the completion of the tests suites\n    -c: run tests with coverage\n   -h, --help: show this help message\n    --: pass extra options'
KEEP=0
FORCE_STOP_JEST='--forceExit'
ONLY_CONTAINERS=0
STOP_CONTAINERSq=0
COMMAND_ARGS=''

function moveToTestDir {
    echo 'Moving to tests dir'
    cd ${root}/tests
}

function moveToRootDir {
    echo 'Moving to root dir'
    cd ${root}
}

## obtain options
while [ "$1" != "" ]; do
  case $1 in
    -oc | --only-containers )  ONLY_CONTAINERS=1
                          ;;
    -sc | --stop-containers )  STOP_CONTAINERS=1
                          ;;
    -k | --keep )     KEEP=1
                          ;;
    -c)                   shift
                          COMMAND_ARGS="${COMMAND_ARGS} --coverage"
                          ;;
    -h | --help )         echo "$USAGE"
                          exit
                          ;;
    --)                   shift
                          while [ "$1" != "" ]; do
                            COMMAND_ARGS="${COMMAND_ARGS} -- $1"
                            shift
                          done
                          ;;
    * )                   echo "$USAGE"
                          exit 1
  esac
  shift
done

## STOP_CONTAINERS is a final option
if [ $STOP_CONTAINERS -eq 1 ]; then
    echo 'Stopping docker containers'
    moveToTestDir
    docker-compose down
    exit 0
fi

## ONLY_CONTAINERS must be 1 and STOP must be 0
if [ $ONLY_CONTAINERS -eq 1 ] && [ $STOP -eq 1 ]; then
    echo 'Invalid options - when using option -oc, option -ns must be used as well'
    echo "$usage"
    exit 1
fi

## should we check if docker is running?
echo 'Starting docker containers'
moveToTestDir
docker-compose up -d

if [ $ONLY_CONTAINERS -eq 1 ]; then
    exit 0
fi

## run tests
echo 'Running tests'
moveToRootDir

if [ $KEEP -eq 0 ]; then
    FORCE_STOP_JEST=''
fi

yarn jest $COMMAND_ARGS $FORCE_STOP_JEST

if [ $KEEP -eq 0 ]; then
    ## stop docker containers
    echo 'Stopping docker containers'
    moveToTestDir
    docker-compose down
fi