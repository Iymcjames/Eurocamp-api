# Installation

### Prerequisites

- docker installed | https://docs.docker.com/get-docker/
- git installed | https://git-scm.com/book/en/v2/Getting-Started-Installing-Git
- WSL2 for windows | https://learn.microsoft.com/en-us/windows/wsl/install
- A database GUI
- NPM | https://docs.npmjs.com/cli/v6/commands/npm-install
- Postman | https://www.postman.com/

### Steps

1. Git clone the repository https://github.com/Iymcjames/Eurocamp-api.git
2. `cd` into the engineering-test directory
3. run `docker-compose up -d --force-recreate` (some versions of docker will use docker compose rather than docker-compose)
4. run `docker exec -it engineering-test-eurocamp-api-1 npm run seed:run` (sometimes the name is different, check with docker ps)
5. Check that there is data in the database tables (see below for connection details). Also review the api documentation at http://localhost:3001/api
6. Load the postman collection from the root directory 'Engineering.postman_collection.json' and test the api endpoints.
7. Dont forget to do a `yarn install`, add `--force`, if there are issues

#### Connection details

Credentials for your database GUI

HOST=localhost
PORT=5433
USER=postgres
PASSWORD=postgres
NAME=eurocamp_api
