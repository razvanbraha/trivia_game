# Contents
* [Required Technologies](#required-technologies)
  * [Developer tools](#developer-tools)
  * [Environment](#environment)
  * [AI integration](#ai-integration)
  * [Local Deployment](#local-deployment)
* [Design Overview](#design-overview)
* [Shibboleth](#shibboleth)
* [Page structure](#page-structure)
* [API Calls](#api-calls)
* [Web sockets](#web-sockets)
* [Database Structure](#database-structure)
* [Testing](#testing)

# Project Technologies
## Developer tools
Required
* [git](https://git-scm.com/install/)
* [Docker desktop](https://www.docker.com/products/docker-desktop/)
* [Visual Studio Code](https://code.visualstudio.com/)
Recommended
* VS Code extensions
	* [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
	* [Container Tools](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-containers)
	* [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
	* [Docker](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker)
## Environment

The Sustainable Box Trivia game('the application') consists of several containers all run in **Docker** containers. Therefore the following environment requires no setup other than what is handled by Docker.

The application uses [apacheshib](https://github.com/ncstate-csc/apacheshib), a preconfigured docker image which acts as a [reverse proxy](https://www.cloudflare.com/learning/cdn/glossary/reverse-proxy/). This receives all external requests before routing them internally within the docker compose stack. The image also allows the application to verify user identity with NCSU's shibboleth service when necessary.

The backend is primarily coded in **Javascript**, using **Node JS**. The API is made accessible via an **Express** server. We also use a **websocket** server in parallel, in order to handle communication associated with gameplay.

The frontend serves css and client side js
## AI integration

## Local Deployment
# Design Overview
(High level design diagram)

(docker-compose.yml image)
# Code structure Overview
	app
		backend
			db-queries - Database interface
			game - Core game logic
			middleware - Shibboleth middleware to gate API
			pages - Routers to serve pages
			rest_api - Routers to serve API requests
			templates - Main html pages
			tests
			Dockerfile
			package.json
			server.js
		frontend - Contains static assets(css, js) but NOT main html pages
	shared
		ws-api.js - Websocket api shared
	docker-compose.yml - Creates the docker structure shown in Design Overview
# Shibboleth
# Page structure
# API Calls
# Web sockets
# Database Structure
# Testing