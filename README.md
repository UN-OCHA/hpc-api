# hpc-service v3

This repository serves as a proof of concept for hpc-service v3

# Prerequisites

- node v14
- yarn

## Running Locally

Install dependencies
`yarn`

Create local enviroment variables file
`cp .env.EXAMPLE .env`

To run this projects docker containers:

`docker-compose up -d`

## Restore database

You will need an LDAP account to populate the local db with data.

`bin/sync-db.sh -e prod -u <username>`

## Graphql Playground

Graphql Playground is a ui to interact with graphql schemas that is bundled with apollo. It can be accessed on:

http://localhost:4000/graphql`

Documentation can be found here https://github.com/graphql/graphql-playground

Alternatively Apollo Studio Explorer can be used:

https://www.apollographql.com/docs/studio/explorer/

## REST api

All rest endpoint are appended with `/rest`.

Documentation is provided by swagger at:

http://localhost:4000/rest/api-docs/
