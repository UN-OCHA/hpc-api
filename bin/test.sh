root=$(pwd)

#Global variables
USAGE='this is the usage'
DEBUG_USAGE='this is the debug usage'
KEEP=0
ONLY_CONTAINERS=0
STOP_CONTAINERSq=0
COMMAND_ARGS='--'

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
    -d | --debug )        echo "Debug usage"
                          echo "$DEBUG_USAGE"
                          exit 0
                          ;;
    -oc | --only-containers )  ONLY_CONTAINERS=1
                          ;;
    -sc | --stop-containers )  STOP_CONTAINERS=1
                          ;;
    -k | --keep )     KEEP=1
                          ;;
    -h | --help )         echo "$USAGE"
                          exit
                          ;;
    --)                   shift
                          while [ "$1" != "" ]; do
                            COMMAND_ARGS="${COMMAND_ARGS} $1"
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
yarn jest

if [ $KEEP -eq 0 ]; then
    ## stop docker containers
    echo 'Stopping docker containers'
    moveToTestDir
    docker-compose down
fi