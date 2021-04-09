This document is for those that wish to either contribute to the HPC.tools API
codebase, or who wish to run a local version of the API for development or
testing purposes.

This repository only contains the code for the new `v4` endpoints that are
currently in the planning and early development stages.
The repositories that host the code for our other endpoints are not currently
open-source.

## Prerequisites

- node v14
- yarn

## Running Locally

Install dependencies
`yarn`

Create local enviroment variables file
`cp .env.EXAMPLE .env`

To run this projects docker containers:

`docker-compose up -d`

NOTE: You must have the development server running whilst you are working on this project as nexus
generates type definitions from from the graphql schema.

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
