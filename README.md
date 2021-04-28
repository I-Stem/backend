# Devops Metrics

- [![Maintainability](https://api.codeclimate.com/v1/badges/0abf5009e604ee7d2271/maintainability)](https://codeclimate.com/github/I-Stem/backend/maintainability)
- [![Test Coverage](https://api.codeclimate.com/v1/badges/0abf5009e604ee7d2271/test_coverage)](https://codeclimate.com/github/I-Stem/backend/test_coverage)


# Introduction

   For an intro about who we are and what we aim to develop, go [here](https://i-stem.github.io).

## API for accommodation services developed by I-Stem

   This repo is backend for AI-powered I-Stem assistive technology solutions. Please click [here](https://github.com/I-Stem/frontend#introduction) to go to front end repo for this project which lists the current feature provided by this portal to its end-user.

# Contents

* [Tech stack](#tech-stack)
* [What this repo does?](#what-this-repo-does?)
* [Global Requisites](#global-requisites)
* [Project Setup](#project-setup)
* [Getting Started](#getting-started)
* [API Documentation](#api-documentation)



# Tech Stack

-   **Node.js** - Javascript runtime for server environments.
-   **Typescript** - Superset of JavaScript which primarily provides optional static typing, classes and interfaces.
-   **DOTENV** - For storing configuration into the `process.env`
-   **Mongoose** - Mongoose provides a straight-forward, schema-based solution to model your application data. It includes built-in type casting, validation, query building, business logic hooks and more, out of the box.
-   **Express.js** - A minimal and flexible Node.js web application framework that handles server-side rendering and integrates with Next.js.
-   **Express Router** - It's used for routing and have distributed Routes into two files ie. Web Routes & API Routes. The web routes are using [CSRF Token](https://github.com/krakenjs/lusca) while the API routes are using [JSON Web Token](https://github.com/auth0/express-jwt).
-   **Winston Logging Framework** - For logging the messages.
-   **Redis** - Redis is an open source (BSD licensed), in-memory data structure store, used as a database, cache and message broker. It's used for background queues. And uses redis with "bull" as interfacing library.
-   **AWS s3** - Amazon storage service for storing raw files from users.
-   **Mocha** - Testing library for node.js.

# What this repo does?

* Persists and does database operations on all the user data in mongo database.
* Defines the workflow followed by different AI-powered and manual processes for different accessibility remediation solutions.
* Contains most of business logic and domain models for the system.
* Delegates the actual AI-powered remidiation of inaccessible content  to accommodation-automation repo.

# Global Requisites

|  Package |  URL |  
|---|---|
|  Node.js ^12.x|  https://nodejs.org/en/download/  |   
| Yarn  | https://classic.yarnpkg.com/en/docs/install/  |  
| Redis | https://redis.io/download |
| Mongoose | https://mongoosejs.com/ |
| Git | https://git-scm.com/downloads 

# Project Setup

   The project requires following technologies up and running or setup before starting up server:

## Redis

   Redis is used as message broker within the project for performing all external API calls. 

### Installing and Configuring Redis for Linux
- [How To Install and Secure Redis](https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-redis-on-ubuntu-18-04)

### Installing Redis on windows

   The official windows binaries provided by redis are outdated. Therefore one has to use docker image of redis to have latest redis version  running in local. To run docker desktop is required which again has some constraints as per windows version, which one can look up [ere](https://docs.docker.com/docker-for-windows/install/).

      But [this guide](https://medium.com/@harsh1111/redis-docker-a-hands-on-b0e1cdda59e6) is a good starting point for setting up redis in local on windows.

### Redis on cloud

   If you are constrained by window versions and don't have access to linux distribution, redis does provide 30 mb free free storage via its cloud db. You could see their official doc [here](https://redislabs.com/get-started-with-redis/) for the setup.

## Mongo db

   Mongo db is being used as persistence store for this project, so one has to download and setup the mongo db in local.
   
### Installing and Configuring MongoDB  for Linux
- [Install MongoDB](https://hevodata.com/blog/install-mongodb-on-ubuntu/)

### Installing MongoDB on windows

-   [Official guide](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/)

### Mongo on cloud

   If the local setup doesn't work for you or its too heavy for computer configuration, one can use free account by mongo which provides 512 MB space in cloud. Their official guide [here](https://docs.atlas.mongodb.com/getting-started/) is a good starting point for it.

### Installing MongoDB Compass

   MongoDb compass is a developer UI tool to access, create or modify the collections  stored in a mongo db. The following is a good starting point to install this developer tool.

- [MongoDB Compass Download](https://www.mongodb.com/try/download/compass)

## AWS account

   The repo uses AWS s3 storage to store files uploaded by user. Also for sending emails to end user regarding their service request being completed or other notifications, it uses AWS email service. Therefore its necessary to have AWS account to run code as it is in your local. 


# Getting Started

## Grabbing the code

```bash
# Clone the repo: https://github.com/I-Stem/backend
git clone https://github.com/I-Stem/backend.git

# Goto the cloned project folder.
cd backend;
```

> _Note: Copy the ".env.example" as ".env" file in the project root folder and add your `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`_

### Installing the dependencies:

**Using npm**

```sh
npm install
```

**Using yarn**

```sh
yarn install
```

### Starting the development server:

**Using npm**

```sh
npm run start:dev
```

**Using yarn**

```sh
yarn start:dev
```



## Peer repos

* [Front-end repo for this](https://github.com/I-Stem/frontend)
* [AI services used by this portal](https://github.com/I-Stem/science)

# API documentation

   Please have a look [here](https://i-stem.github.io/backend).