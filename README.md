# Capstone Starter

A capstone starter application.

## Technology stack

This codebase is written [Typescript](https://www.typescriptlang.org/) and uses [Express](https://expressjs.com/)
and [Mustache Templates](https://mustache.github.io/).
It stores data in [PostgreSQL](https://www.postgresql.org/), and a [GitHub Action](https://github.com/features/actions)
runs tests.

## Architecture

The Capstone Starter consists of three free-running processes communicating with one Postgres database.

1.  The data collector is a background process that collects data from one or more sources.
1.  The data analyzer is another background process that processes collected data.
1.  The web application displays results to the user.

## Local development

1.  Install [node](https://formulae.brew.sh/formula/node) and [PostgreSQL 17](https://formulae.brew.sh/formula/postgresql@17).
    ```shell
    brew install node postgresql@17
    brew services run postgresql@17
    ```

1.  Set up environment variables.
    ```shell
    cp .env.example .env 
    source .env
    ```

1.  Set up the database.
    ```shell
    psql postgres < databases/create_databases.sql
    npm run migrate
    DATABASE_URL="postgresql://localhost:5432/capstone_starter_test?user=capstone_starter&password=capstone_starter" npm run migrate
    ```

1.  Run tests.
    ```shell
    npm run test
    ```

1.  Run the collector and the analyzer to populate the database, then run the app and navigate to
    [localhost:8787](http://localhost:8787).
    ```shell
    npm run collect
    npm run analyze
    npm run start
    ```

## Create a database schema migration

Use knex to create a database schema migration.

```shell
npx knex migrate:make "[Description of change]" --knexfile databases/knexfile.js
```

## Build container

1.  Build container
    ```shell
    npm run build
    docker build -t capstone-starter .
    ```

1.  Run with docker
    ```shell
    docker run --env-file .env.docker --entrypoint ./collect.sh capstone-starter
    docker run --env-file .env.docker --entrypoint ./analyze.sh capstone-starter
    docker run -p 8787:8787 --env-file .env.docker capstone-starter
    ```   
