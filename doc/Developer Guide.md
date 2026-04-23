# Introduction
This document is for developers working on the Sustainable Box Trivia Game, which we will refer to as "the project" in the abstract and "the application" as a running instance. We assume familiarity with the goals and motivation for the project. This guide provides a technical overview of the project, including the code and folder structure as well as the tools used to edit these and the technologies the project depends on.

For info on how to *use* the application, see [User Guide](./User%20Guide.md).

For info on how to *deploy* the project to a server and *run* the application, see [Deployment Guide](./Deployment%20Guide.md).

For a new developer (or team of developers), begin with the Getting Started section.

### Contents
1. [Getting Started](#1-getting-started)
	* [Project Technologies](#11-project-technologies)
	* [Local Deployment](#12-local-deployment)
2. [Design](#2-design)
	* [High Level Design](#21-high-level-design)
	* [Container Stack](#22-container-stack)
	* [Folder Structure](#23-folder-structure)
3. [Shibboleth](#3-shibboleth)
4. [Pages](#4-pages)
	* [HTML](#41-html)
	* [Scripts](#42-scripts)
	* [Creating New Pages](#43-creating-new-pages)
5. [REST API](#6-rest-api)
	* [Express Routers](#51-express-routers)
	* [Creating New Endpoints](#51-creating-new-endpoints)
6. [WebSockets](#6-websockets)
	* [Connection](#61-connection)
	* [Protocol](#62-protocol)
	* [Usage](#63-code-and-usage)
	* [Creating New Signals](#64-creating-new-signals)
7. [Data Persistence](#7-data-persistence)
	* [Users](#71-users)
	* [Questions](#72-questions)
8. [Testing](#8-testing)
	* [Setup Tests](#81-setup-tests)
	* [Run Tests](#82-run-tests)
	* [Writing Tests](#83-writing-tests)
9. [Example Modification](#9-example-modification)
10. [Suggested Improvements](#10-suggested-improvements)

# 1. Getting Started

Here we present the essential tools and technologies used to develop, build, and run the project, and provide steps to set up the development environment.

## 1.1 Project Technologies

### i. Languages

The project is primarily coded using JavaScript. As a web application, it necessarily uses HTML and CSS as well. The database uses SQL for data creation and manipulation. Docker uses `Dockerfile` commands and configurations in YAML. We also use Markdown for much of our notes and this documentation within the project.

### ii. Dependencies

The developer *must* have some familiarity with the following technologies that the project uses:
- Docker: creates and manages containerized applications
- Node.JS: JavaScript runtime for developing standalone applications outside of a web environment
- Express: a Node.JS package that provides straightforward webserver capabilities
- MariaDB/MySQL: database management

Of these, only Docker is technically *required*; it handles installing all of the other technologies into the containers during the build process. 

### iii. Developer tools

The following technologies are used as part of development. The developer should have them installed and be familiar with their use:

| Tech | Version | Reason |
| --- | --- | --- |
| [git](https://git-scm.com/install/) | latest | version control |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | latest | containerization, reliable and reproducible build process; handles all other dependencies |
| [Node JS](https://nodejs.org/en/download) | LTS 24 | not technically required, since Docker installs it to a container anyway, but `npm` is useful to a developer for editing Node package configurations |

The developer has their choice of text editor/IDE; we use and highly recommend [VS Code](https://code.visualstudio.com/) as a lightweight but powerful option. It or a compatible program like VSCodium are required for running our tests. In addition, we recommend the following extensions:
* [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
* [Container Tools](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-containers)
* [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
* [Docker](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker)
* [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens)

The developer should be familiar with a command-line shell that interprets a bash-like language (bash, zsh, fsh), and should have access to a terminal emulator. These are included by default on Mac and Linux; Windows users have a few good options:
* built-in terminal in VS Code
* git bash - comes with Git for Windows, uses MINGW for compatibility
* [MobaXTerm](https://mobaxterm.mobatek.net/) - uses CYGWIN for compatibility, also provides SSH and session management (useful for working with a remote server)
* [Windows Terminal](https://apps.microsoft.com/detail/9n0dx20hk701?hl=en-US&gl=US) - this synergizes particularly well with [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) for a native Linux environment within Windows


## 1.2 Local Deployment

Here are the basic steps to get the project code onto a developer's local machine. For a thorough guide to remote deployment, see the [Deployment Guide](./Deployment%20Guide.md).

### i. SSH Setup

At the time of writing, the project is hosted on NCSU's Github Enterprise at the url: `https://github.com/ncstate-csc-sdc/2026Spring-Team05-Lavoine.git`

Because of the shift to Github Enterprise, NCSU requires Single Sign-On authentication for access to the repository. To enable this, you must have an SSH key on your local machine, add it to your NCSU Github account, and authorize the key with the organization that owns the repository.

If you have already done all this, great! You should be able to clone the repository and can skip to the next step. If not, you should do the following:
1. create an SSH key on your local machine: 
`$ ssh-keygen -t ed25519 -C "<your name> <your email>"`
	- you will be prompted to create a password
		- if you do, you will be prompted for it everytime you do a remote git operation like `clone` or `push` 
		- you can instead leave this blank for convenience

2. add the key to your NCSU github account:
	- copy the contents of `~/.ssh/id_ed25519.pub` (if you named your key differently or stored it someplace else, copy the contents of the `.pub` file generated)
	- go to your NCSU account on github.com
	- under Profile > Settings > SSH and GPG keys, select "new SSH key" and paste the contents from before
3. authorize the key for the owning organization with the 'configure SSO' option, which will ask you to sign in using your NCSU credentials

NOTE: if you have a personal github account already that uses SSH, the hostname `git@github.com` will be ambiguous and cause errors. You should create a second SSH key and configure custom hostnames to get around this - one member of our team uses `id_school_ed25519` and `git@github-school` for this. This only causes issues when initially cloning the repository. Once cloned, the local `.git` data handles SSH for you.

### ii. Clone The Repository

Use `git` to clone the project repository via a terminal:
- create a folder to hold the repository: `$ mkdir <path>`
- navigate to this folder: `$ cd <path>`
- clone the repository: `$ git clone <URL> .` 
	- this clones the repo into the current folder; delete the dot `.` at the end to automatically create and clone into a sub-folder instead
- assuming the project is hosted the same was as at the time of writing, the URL to clone should be: `git@github.com:ncstate-csc-sdc/2026Spring-Team05-Lavoine.git`
	- if this has changed, consult the sponsor or IT staff hosting the project
	- (depending on your ssh setup, the `github.com` part may need to be a custom hostname)

For additional info on how to do this, see [GitHub Docs](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository).

### iii. Configure Environment Variables

Once you have cloned the repository, the next thing to do is setup environment variables in the `.env` file:

1. Navigate to the root of the repository
2. Copy the `.env.template` file into a `.env` file at the same location: `$ cat .env.template > .env`
3. Open the new `.env` file. you should see the following:

![../.env.template](./img/env_template.png)

4. Most of the variables are configured for you; however, you will need to set the following manually:
	- `MYSQL_ROOT_PASSWORD` - can be any arbitrary password, as it is only used internally by Docker
	- `ADMIN_PASSWORD` - should be something simple for development, as it is required every time a user edits other users from the application page; for deployment this should be a strong password set by the sponsor
	- `SERVER_NAME` should be `localhost` for local development; should be the hosting machine's URL for remote deployment (see the [Deployment Guide](./Deployment%20Guide.md))
5. Optionally configure the `GEMINI_KEY` variable: this is not required to manually add questions, but allows Google Gemini to fill in question fields for the user
	- navigate to https://aistudio.google.com/app/apikey 
	- create a new API key; this can have any name, but ideally something descriptive for this project
	- copy the newly created key and paste it as the value of `GEMINI_KEY`
	- NOTE: the number of requests will be fairly limited with a free account, and you may want to use a paid or upgraded account instead

### iv. Run With Docker

1. Ensure Docker Desktop is installed and running (you may want to configure it to start automatically when your machine boots)
2. Navigate to the root of the directory
3. Build the project interactively with the provided rebuild script:
`$ ./rebuild`
4. Alternatively, you can manually (re)build the project at any time with the following individual commands (`rebuild` just wraps these commands with some prompting):
	- `$ docker compose down -v` - clear any existing containers/volumes
	- `$ docker compose build --no-cache` - build the containers "from scratch", ignoring any cached files (which may cause issues)
	- `$ docker compose up` - start the containers
	- `$ docker compose up --build` - builds and run the containers in one command

If you encounter issues with changes not being reflected in the browser, ensure you hard refresh your current page by pressing `Ctrl + Shift + R` or open the application again in a new tab to fetch the latest version of all frontend files.

If you made it here, congratulations! You have the project on your local machine, and you can build and run it with Docker. You can verify that the
app has launched locally by opening a browser tab and navigating to `localhost`.

# 2. Design
## 2.1 High Level Design

![](./img/high_level_design.png)

The project is designed as a full-stack web application.

The primary technology required for developing and running the application is Docker. We are assuming some familiarity with Docker; see the official website's [documentation](https://docs.docker.com/get-started/).

As a brief introduction, Docker allows us to organize our application into individual components that run in isolated environments called *containers* These are like lightweight virtual machines, managed by the Docker engine. Designing the application like this ensures that each component builds and behaves consistently regardless of the underlying operating system. The group of containers working together is called a *container stack*.

Docker handles creating the containers and connecting them to each other, including importing required dependencies. This is extremely convenient: the developer only *really* needs git, docker, and a text editor to work on the project.

Users interact with the running application via their browser. HTTP requests from the user flow to the container stack, where the application handles them.

## 2.2 Container Stack

The application uses four containers that serve distinct purposes. This section is an overview of each one. The part of the title in parentheses is the name of the container service in our [docker-compose.yml](../docker-compose.yml) file.

### i. Shibboleth (`apacheshib`)

We use [apacheshib](https://github.com/ncstate-csc/apacheshib), a preconfigured Docker image which acts as a [reverse proxy](https://www.cloudflare.com/learning/cdn/glossary/reverse-proxy/). All external requests first go through this container before being routed internally to the other containers within the stack.

This image allows us to call into NCSU's Shibboleth service to authenticate the user and authorize their access to the teacher-only set of pages.

For more info see [this section](#3-shibboleth).

### ii. NginX (`frontend`)

The 'frontend' of the application is served from an `nginx` webserver container. This automatically handles requests for certain publicly visible resources listed in the HTML of pages, such as page scripts and CSS files. Importantly, this does NOT serve the HTML itself - those are behind API routes in the backend container to prevent unauthorized access to the teacher-only pages and avoid exposing the internal file structure of the code.

### 2.2.iii Node (`api`)

The 'backend' is primarily coded in JavaScript, which runs on an Express server in a `Node.JS` container. The backend supports API endpoints for viewing pages, managing questions and users, starting games, and upgrading to websocket connections for live gameplay.

### 2.2.iv MariaDB

The backend persists data by communicating with a `mariadb` container that maintains a `MySQL` database. 

## 2.3 Folder Structure 
Important folders/files:

	app/
		backend/
			db-queries/
			game/
			middleware/
			pages/
			rest_api/
			templates/
			tests/
			Dockerfile
			package.json
			server.js
		frontend/
			public/
			teacher/
			index.html
	shared/
		ws-api.js
	docker-compose.yml
	.env
	.env.template
	rebuild


This folder structly loosely mirrors the containers created in Docker.

### i. Backend:

Backend files are the bulk of the project code, under `app/backend/`. There are a few files stored here directly:
- `Dockerfile`: commands to build the "api" (backend) container
- `package.json`: used by Node.JS to manage dependencies
- `server.js`: the "main" file of the app, where execution starts

(you may also see an empty `ws-api.js` file; this is explained below)


The rest are further grouped into subfolders:
- `db-queries/`: code that interfaces with the database
- `game/`: code handling game sessions and gameplay
- `middleware/`: Shibboleth middleware to gate page/API access
- `pages/`: Express Router code to serve page contents (from `templates/`)
- `rest_api/`: Express Router code to serve API endpoints (see [API Calls](#api-calls))
- `templates/`: HTML files for pages (corresponding frontend scripts are located under `/app/frontend/public/js`)


### ii. Frontend:

Frontend files are located under `app/frontend/`. Most of these are publicly-visible files that are requested by the HTML of each page, located under `app/frontend/public/`:
- `css/`: CSS styling files
- `js/`: page scripts
- `templates/`: reusable HTML templates for portions of page structure (not to be confused with the `templates/` folder under `backend/`, which stores entire pages in their raw form)
- `components/`: reusable custom HTML components

There is also `index.html` and `teacher/index.html` under `frontend/`, which exist to redirect the user to the `/api/` path for Shibboleth to kick in.

### iii. Database

Outside of `app/`, there are a few other major files/folders. `database/` contains two folders. `schema/` contains the SQL files used to initiated the database from scratch. `data/` persists the data in the database when the container is not up, and should not be tampered with. It is included in our `.gitignore` to avoid overwriting the database with git operations. 

In a pinch, `data/` can be deleted to completely wipe the database. `schema/` will be used to rebuild it and insert initial data on the next container rebuild.

### iv. Additional
The `shared/` folder contains the single file `ws-api.js`, which implements our WebSocket protocol. When the containers are built, docker copies this file into the backend *and* frontend containers; this way, developers need only edit the file in one location to apply changes consistently. 

You may see an empty `ws-api.js` in the locations where the file is ultimately copied to. On the backend, this prevents Node from throwing errors due to a missing file at build time when the container is created but the volume that maps ws-api into the container has not yet been mounted.

There are a few other files in the root of the project:
- `docker-compose.yml`: configuration for the container stack
- `.env`: environment variables (ignored by git to avoid leaking secrets)
- `.env.template`: template for `.env` with sensitive variables blank
- `rebuild`: simple shell script to rebuild the project

# 3. Shibboleth

See also documentation for the [apacheshib-proxy container](https://github.com/ncstate-csc/apacheshib/blob/main/apacheshib-proxy/README.md).

From Campus IT, "[Shibboleth](https://incommon.org/software/shibboleth/) is a web-based federated authentication system, that allows for authentication across organizational boundaries.". Our application uses Shibboleth to authenticate teachers or any other users who are authorized to access teacher pages. 

To find out more about how users may be added or removed from having teacher permissions, see [Database Structure.](#database-structure) 

We protect certain routes and pages behind middleware defined in [shib-middleware.js](/app/backend/middleware/shib-middleware.js) which, if the user does not have a cookie attached by shibboleth, redirects them to the login page. 

![](./img/shibboleth-code-1.png)

This login page is /teacher by default, as defined in .env as `LOGIN_PATH=/teacher`. This configuration makes the shibboleth reverse proxy container intercept the request and redirect the browser to the login page.

Upon returning from the login page, any requests made by the browser will now contain the username accessible by `req.headers["x-shib-uid"]` which our application then checks against authorized users. 

# 4. Pages

## 4.1 HTML and CSS

As noted in the [design](#2-design) section, the raw HTML for pages is served behind backend api routes. However, this HTML can freely request anything within the `frontend` folder, which is served by the `nginx` frontend container.

The header component used by most pages is created with a custom HTML component: `<header-component></header-component>`. Include this at the start of the `<body>` section of the HTML, and include the script `"/components/header.js"` in the `<meta>` section as well.

The file `styles.css` applies to all pages and should be included in new ones, while `games.css`, `questions.css`, and `interactive-box.css` are only applied to certain pages. We use bootstrap to do a significant amount of styling directly within the HTML of a page as well. 

## 4.2 Scripts

Most pages have a script as well, and most of these live in `app/frontend/public/js`. Scripts specific to a particular page should be named the same as that page for consistency.

Other scripts should be included in all pages, such as the header component script in `app/frontend/public/components/header.js`.

The game scripts are unique from the others in that they switch from HTTP requests to live WebSocket connections using our protocol (see this section). These frequently edit the HTML of the page frequently in-place in reponse to signals, using the helper scripts `game-helpers.js` and `study-game-helpers.js`.

`interactive-box.js` provides the code for the interactive 3d box that displays user progress in each category. 

## 4.3 Creating New Pages

To create a new page, you must do a few things. First, the page should have 
an appropriately-named route on the backend that responds to a `get` request with the page HTML, which should be in `app/backend/templates`. See [the next section](#5-rest-api) for adding routes in Express.

The page can then include whatever scripts and CSS are necessary from `app/frontend/`. Scripts should be added under `public/js` here and named appropriately. CSS should either be added to the `public/css/styles.css` file to be shared across most pages, or to a new css file under `public/css/` specific to this page, or wrangled directly from Bootstrap in the HTML.

# 5. REST API

## 5.1 Express Routers

All API calls are routed through an [express](https://expressjs.com/en/guide/routing.html) server, which then are subdivided into several different routers. 

All routes below are prepended by `<host>/api/` when accessed from the browser (e.g. `localhost/api/users`):

![](./img/api-code-1.png)

Pages are served by the paths `/teacher`, `/student`, and `/play` (aside from index.html). Details on these pages and their scripts can be found in [the previous section](#4-pages). 

API routes are served by the routes `/questions`, `/users`, `/ai`, and `/games`.

Overview of API:
* `GET/POST/PUT/DELETE /api/questions` - CRUD operations for questions
* `GET/POST/PUT/DELETE /api/users` - CRUD operations for users
* `POST /api/ai/gemini` - Prompt gemini AI for question generation
* `GET /api/games/:code` - Check if game session exists
	* Used before opening websocket 
* `POST /api/games/` - Create a game session

All the API routes are well documented, so refer to those files in `/app/backend/rest-api/` for more details.

## 5.2 Creating New Endpoints




# 6. WebSockets

The project uses WebSockets for real-time gameplay communication. WebSockets are much faster and more versatile than HTTP requests, but they require more setup on the developer's part: we must define our own protocol for communication. 


## 6.1 Protocol

Our websocket protocol is based on the concept of signal passing. It is handled primarily by the file `shared/ws-api.js`, which is copied via docker into both the frontend web server and backend. This provides an interface to initialize websocket connections, send signals, and perform actions in response to received signals. 

Each signal is sent as a JSON object with the following structure:

	{
	Type: <signal>
	Body: { <data> }
	}

Signals are declared as part of the `signals` object, which makes up most of the code for the page. Signals are keyed by their own names, and include some metadata about their body structure for simple validation.

We highly recommend reading [ws-api.js](http://ws-api.js) for more information, as we have tried our best to document the signals clearly there. Adding new signals is fairly straightforward: add a new key to this object, and then add the metadata

A few signals are very basic and built-in: ACK, RES, and ERR. ACK and ERR are acknowledgement and error signals, used to test connection and send error messages.

Of special note is the RES signal. Its body looks like:

	{
		to: <signal>
		success: <status>
	}

It stands for "RESPONSE" or "RESULT", depending on how the user thinks about it. Along with the `expect()` method, this signal provides a mechanism for indicating the results of a requested operation, which is discussed in more detail below.

## 6.2 Connection

Upon application start, the backend server initializes a websocket server attached to the same address and port as HTTP server started by Express.

The client must initiate connections, and will always first send an ACK signal to test the connection once the websocket is open. 

The websocket connection is not the same as a game connection. Once the websocket connection is initiated, the client must then send a JOIN signal to the server with a game session code to be added to that session’s list of users.

![](./img/websockets.png)

Initiate a connection by creating a new WebSocket object with the same host as the server and the `wss://` protocol. The following code accomplishes this:

	const ws_url = `wss://${window.location.host}/api/`;
	ws = new WebSocket(ws_url);

After this, `ws` is a new WebSocket object awaiting connection; when it connects, an `"open"` event will fire. 

## 6.3 Our API

Our API attaches several methods to a WebSocket object related to sending and receiving signals with our protocol.

The first function of concern is `ws_api.init(ws, user, handler, first)`. This function does several things to make the target WebSocket object (`ws`) more usable. 

1. it attaches a user type and some automatic handling for certain built-in signals (ERR, ACK). 
2. it attaches several useful methods (wherever `sig` appears it should always be called with one of the members of `ws_api.signals` as a value):
	- `signal(sig, body)`: sends a signal with the given body
	- `respond(sig, success)`: respond to a received signal with a success status
	- `expect(sig, action)`: anticipate a response to a particular signal type, calling the provided `action()` with the value of `success` in the response signal
	- `err(err)`: send an ERR signal with the given message
	- `kill(reason)`: close the connection with a reason
3. it attaches a validation layer that prevents sending signals with invalid bodies and logs receiving them with such.
4. it provides a way for users to attach handlers to support responding to other signals. This is achieved by passing in a handler object.

## 6.4 Handlers

A handler object is attached to a WebSocket object with the `ws_api.init()` function, as seen above. This object contains functions to handle signals as fields, keyed by the signal name each handles. 

To help with setting up the handler object, the API provides another function: `ws_api.support(signal, handler, action)`. This adds `action()` as a field of `handler` with the key `signal`. `action()` always receives two parameters: the WebSocket object which generated the signal (useful for the backend code to differentiate players) and the body of the signal.

When the WebSocket receives any signal, it will first check for a few built-in types and handle these automatically. Then it will check if its handler object supports the signal; if it does, it will call the attached function for that signal.

As an example, here is how the server responds to a WebSocket connection being opened:


```js
// in app/backend/server.js ...

const init_handler = {};
// add JOIN signal support
ws_api.support(init_handler, ws_api.signals.JOIN, (ws, body) => sessions.join(ws, body));

function setupWSS(server) {
	const wss = new WebSocketServer({ server });

	wss.on("connection", (ws) => {
		console.log("received incoming ws connection");
		ws_api.init(ws, ws_api.users.SERVER, init_handler, null);
	});
	
	console.log(`Websocket server running`);
}
```

This code sets up a WebSocket server on top of the existing HTTP Express server. The WebSocket server responds to a "connection" event by calling `init()` on the `ws` object generated by the event, attaching the handler object `init_handler`. Above, `init_handler` is created as a plain object and `support()` adds support for the JOIN signal. In this case, the response to a JOIN signal is just to pass `ws` and the body of JOIN into `sessions.join()`, which handles associating this WebSocket connection with an open game session.

The code will often follow this 'reverse' pattern. The handler object is declared first, and callbacks to support various signals are attached to it; then the handler is in turn attached to a given WebSocket object with `init()`.

## 6.5 expect() and respond()

The `respond()` method attached to WebSocket objects is very useful for triggering a linear set of events. The idea is that one member of the WebSocket connection sends a signal that requests some action to be performed; the other member receives that signal, attempts the action, and then sends a RES signal indicating whether the action was accomplished or not.

This method is only half-useful on its own; to be effective, the party that sent the original signal needs to be able to register some action to be performed when it receives a response. This is accomplished with the `expect()` method.

Like with handlers, the `expect()` method code will be written in a kind of 'reverse' order. First, the asking party will call `expect()` to register its callback ahead-of-time. Then, it will call `signal()` to send a signal that requests some action to be performed, like JOIN, and expects a response. When it receives that response from the other party, the registered action is triggered. 

Any signal can more or less be received at any time, and callbacks that handle signals have no way of knowing the current context of that signal besides some kind of global state. `expect()` and `respond()` allow the user to encode a simple assumption of the order of events into certain situations.

Two good example use cases for this mechanism are joining games and kicking players. In both cases a user will request some action (join this game, kick this player) that it must know the result of to proceed, since proceeding involves altering the page structure significantly (showing the lobby of the joined game, redrawing the list of players without the kicked player).

# 7. Database

![](./img/ER-diagram.png)
All fields are required.


For information on using the REST API to access the database, see [API Calls](#api-calls).

`/app/backend/db/` Files Overview:
* `db.js` - Helper methods for other files
* `question-dao.js` - methods for CRUD operations on questions
* `question-validation.js` - methods for validating to-be-created questions
* `user-dao.js` - methods for CRUD operations on users
* `user-validation.js` - methods for validating to-be-created users
## Users

When a request is made to change users, the user making the request will have their unityID matched against [shibboleth](#shibboleth) authentication first for validity. Then userPriv will be queried to check permissions. 

User management permissions can be granted during runtime, or by modifying `/app/database/schema/2-data.sql` to add permissions at database initialization.
![697](./img/db-code-2.png)

Note that users can **only** have user-management permissions if they are Faculty OR in a list of dev users.

![697](./img/db-code-1.png)
## Questions

Category is a number from 1-6 indicating the category. The isAI label will not be removed from an AI generated question, even if the question is edited by a human.

When a request is made to change questions, the user making the request will have their unityID matched against [shibboleth](#shibboleth) authentication first for validity. Then questionPriv will be queried to check permissions

Question management permissions can be granted during runtime, or by modifying `/app/database/schema/2-data.sql` to add permissions at database initialization.
![697](./img/db-code-2.png)

Note that users can **only** have question-management permissions  if they are Faculty OR in a list of dev users

![](./img/db-code-1.png)
# Testing

## Setup Tests

Note that testing is done locally(not using docker) and as such, [Node JS - LTS 24](https://nodejs.org/en/download) is required. 

Before running tests, navigate(in a terminal) to 

`/app/backend/` 

and run

`npm install`

to install all required dependencies, including Jest, our testing framework.

## Run Tests

To run the test script, run(inside `/app/backend`)

`npm test`

This runs a script configured in package.json which runs the tests and generates a coverage reports.
## Writing Tests

Tests exist in the test folder `/app/backend/tests`. 

Since testing is currently done without docker, note that database tests must mock the returns from database queries.

For more info on how to write tests, see [Jest Docs](https://jestjs.io/docs/getting-started).

# 9. Creating New Games

In this section we will list the general steps needed to make a major modification to the project and add a completely new game mode. 

## 9.1 Backend

Begin by creating a new file under `/app/backend/game/`. You can model this file after `study-game.js` and `teaching-game.js`, or create a completely different game flow. These files are complex, and we recommend understanding the basics of how they work before writing your own.

![](./img/example-code-1.png)

Each game file defines an object which can be instantiated as a game session. This object maintains the game state, holds a list of connected player WebSockets, and triggers game actions through WebSocket signals. It may include many helper methods to implement the game flow. The specifics for an arbitrary game are impossible to fully capture in a guide like this - implementing a new game flow is on you. You are welcome to refer to the existing files and compare to the design documents for each to help understand how gameplay is translated from design to implementation. 


Add the game type to the `games` 'enum' in `/shared/ws-api.js` (near the top).

![](./img/example-code-2.png)


Next, edit `/app/backend/game/sessions.js`, the file which manages joining and creating sessions. Import your gameplay file at the top. Then, in the `create` function, explicitly handle the case of the new game type, much like the existing ones:

![](./img/example-code-4.png)


## 9.2 WebSocket Changes

A new game may require new websocket signals to communicate different information from previous ones. Add any new signals to `shared/ws-api.js` for the backend and frontend to automatically include support for them.

See [creating new signals](#63-creating-new-signals) for more information on editing the WebSocket signals. Any changes you make that affect previous signals may require you to go through the other games' code (on both backend and frontend) and edit the handler functions.

## 9.3 Create Game Page(s)

To link up backend support with something a user can access, you must create new pages on the frontend along with scripts to initialize WebSocket connections and handle signals. You will need a page for each type of user that can access the game (at the time of writing, only teachers and students). See [Creating New Pages](#43-creating-new-pages) for a refresher. You will add the page HTML in `/app/backend/templates`. In this file, you will want to add a `<header-component>` and link `header.js`, bootstrap, and stylesheets. You will also want to link `/public/js/ws-api.js` as the first script to run so that the main page script has access to the `api` functions.

![](./img/example-code-5.png)

Next, in `/app/backend/pages/game-pages.js`, create new endpoints to serve your html page.

![](./img/example-code-6.png)

## 9.4 Set Up WebSocket Connection

We structured our implementation so that the user would remain on the same html page throughout gameplay, with the html being dynamically modified by js files. We recommend this approach because it gives a more seamless user experience, and the web socket connection won't be broken by navigating away from the page. This is why `<div id="content">` is empty, as it will be filled by the js functions. 

To start making the page(s) dynamic, create a script for each one under `app/frontend/public/js/` and link it at the top (after `ws-api.js`). Here you will define the logic for the client pages initiate WebSocket connections. 

For reference, review the contents of `tg-host.js` and `tg-player.js`. The general flow of game creation is that when the host user loads the page, the host script makes an HTTP request to create the game and immediately joins the game once the room code is returned, initiating the WebSocket connection with the backend. 

Players can join from their main page; this page pings the server to check whether a session exists for the provided game code. If so, the code is stored in localStorage and the user is redirected to the game page; then the code is loaded and the WebSocket connection is initiated. 

The code to initialize the connection is at the bottom of these scripts. You may want to start with a simple websocket connection that sends ACK to test. Next, you will want to make the page send a JOIN signal with the game code and handle a RES signal responding to it. Once you have established and tested a connection, you can move on to implementing the rest of the page.

## 9.5 Make Pages Dynamic

Finally, add handlers to respond to different signal types. In our code, we declare a `handler` object and attach support for various signals with the `ws_api.support()` function. The handler is attached to the websocket connection object by `ws_api.init()`.

![](./img/example-code-7.png)

The handlers will likely modify the page HTML in response to signals from the server that mark changes in game state. We recommend using a separate file with helper methods to create and manage the html content, so that the logic of gameplay is not cluttered by the logic of altering the page structure. 

In our implementation (`game-helpers.js` for example), we use both templated strings and components stored in `/app/frontend/public/templates/question-template.html` to serve as starting points for making and managing the html content the user is presented.

![](./img/example-code-8.png)

This is a very simplified look at the general details of implementing a new game. The specifics of new gameplay revolve around signals and responses and will likely be complicated - but this is also the fun and creative part of design and implementation! If you follow these general steps you will be well on the way to having a completely new game. 