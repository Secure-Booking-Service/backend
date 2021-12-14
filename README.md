<div align="center">
    <img src="https://raw.githubusercontent.com/Secure-Booking-Service/backend/main/logo.svg" alt="HDD-Rack Icon by Bootstrap" width="100">
    <br>
    <h2>Secure Booking Service - Backend</h2>
    <br>
</div>

[![Badge](https://img.shields.io/badge/project-Secure%20Booking%20Service-blue)](https://github.com/Secure-Booking)
[![SAST](https://github.com/Secure-Booking-Service/backend/actions/workflows/SAST.yml/badge.svg)](https://github.com/Secure-Booking-Service/backend/actions/workflows/SAST.yml)
[![Azure - CD](https://github.com/Secure-Booking-Service/backend/actions/workflows/CD.yml/badge.svg)](https://github.com/Secure-Booking-Service/backend/actions/workflows/CD.yml)

## 📁 Folder /src
This section explains the content of the important folder `/src`.

* `/api/*`: This folder contains all endpoint handlers of the api. Its structure mirrors the path of the api endpoints to find the concurrent handler more easily.
* `/configuration/*`: Contains various configuration files which are loaded at the beginning to set up express, the logger or to validate the environment variables.
* `/routes/*`: This folder contains all routes/endpoints that the backend listens on. These files connect correlating endpoint handlers and their routes. Also these files configure requirements like authentication and authorization.
* `/schemas/*`: Contains database schema definitions for various collections like users or bookings. 

## 🧑‍💻 Development Setup
This section describes the development setup to run the server application locally.
Make sure that you have commit signing active for this repository `git config commit.gpgsign true`.

### ⚗️ Prerequisites
> We have also set up a `.devcontainer`.  [Learn more](https://code.visualstudio.com/docs/remote/containers#_quick-start-open-an-existing-folder-in-a-container)

- Local MongoDB installation on port 27017 (https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/)
- Node with NPM installed (https://nodejs.org/en/download/)

### 🔧 Setup .env
Create a `/.env` file based on `./.env.example`

* `JWT_SECRET` choose a random string
* `RP_ID` choose `localhost`
* `RP_ORIGIN` enter the URL where you open the frontend like `http://localhost:8080`
* `MONGO_ENCRYPTION_KEY` use `openssl rand -base64 32` to generate a value
* `MONGO_SIGNING_KEY` use `openssl rand -base64 64` to generate a value
* `AMADEUS_API_KEY` API-key from [Amadeus Developer Portal](https://developers.amadeus.com/self-service/category/air)
* `AMADEUS_API_SECRET` API-Secret from [Amadeus Developer Portal](https://developers.amadeus.com/self-service/category/air)

### 📁 Installing modules
Run `npm ci` to install all required node modules.

### 🛫 Start development
Run `npm start` at the root of the directory.

---
<div align="left">
    Icon by <a href="https://github.com/twbs/icons">Bootstrap</a> published under <a href="https://github.com/twbs/icons/blob/main/LICENSE.md">MIT licence</a>.
</div>