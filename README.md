# Backend
[![Badge](https://img.shields.io/badge/project-Secure%20Booking%20Service-blue)](https://github.com/Secure-Booking)

## Developement Setup
This chapter descibes the development setup

### Prerequisites ⚗️
> We have also setup a `.devcontainer`.  [Learn more](https://code.visualstudio.com/docs/remote/containers#_quick-start-open-an-existing-folder-in-a-container)

- Local MongoDB installation on port 27017 (https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/)
- Node with NPM installed (https://nodejs.org/en/download/)

- Run 'git config commit.gpgsign true'

### Setup .env
Create a `/.env` file based on `./.env.example`

* `JWT_SECRET` choose a random string
* `RP_ID` choose a random string
* `RP_ORIGIN` enter the URL where you open the frontend like `http://localhost:8080`
* `MONGO_ENCRYPTION_KEY` use `openssl rand -base64 32` to generate a value
* `MONGO_SIGNING_KEY` use `openssl rand -base64 64` to generate a value

### Installing modules 📁
Run `npm ci`

### Start development 🛫
Run `npm start` at the root of the directory.