This document is for those that wish to either contribute to the HPC.tools API
codebase, or who wish to run a local version of the API for development or
testing purposes.

This repository only contains the code for the new `v4` endpoints that are
currently in the planning and early development stages.
The repositories that host the code for our other endpoints are not currently
open-source.

## Prerequisites

- node v18
- yarn

## Running Locally

This repository can be run as a standalone application or as part of [hpc-suite](#Integrated_with_HPC-Suite).

### Standalone

To run this projects docker containers:
`docker-compose up -d`

This will spin up the server and a postgres database. To restore data to this database see the [section below](#Restore_database).

### Integrated with HPC-Suite

This service can be ran as part of the [HPC-Suite](https://github.com/UN-OCHA/hpc-suite). Running instructions are provided in the linked repo.

## Restore database

You will need an LDAP account to populate the local db with data.

`bin/sync-db.sh -e prod -u <username>`

## GraphQL Playground

GraphQL Playground is a UI to interact with GraphQL schemas that is bundled with Apollo. It can be accessed on:

http://localhost:4000/v4/graphql

Documentation can be found here https://github.com/graphql/graphql-playground

Alternatively Apollo Studio Explorer can be used:

https://www.apollographql.com/docs/studio/explorer/
