# Introduction

This guide is for anyone seeking to deploy the Sustainable Box Trivia Game (the application) to a state where it can be accessed by others, whether for playtesting or real-world use.

For information on developing the application in general, see the [developer guide](./Developer%20Guide.md).

For information on how to use the application once deployed, see the [user's manual]().

During development, our team deployed the application for remote testing to a Virtual Machine (VM) requested from and provided by the CSC department staff. We requested an Ubuntu Linux server installation with ports 22 (SSH) and 80 (HTTP) open.

We accessed the server remotely via SSH and cloned our project files into the directory `/srv/lavoine-trivia/`. After setting up the `.env` file, starting the application was as simple as running the `rebuild` script.

This deployment guide will focus on a similar process to the one we followed to get this working, while assuming as little about the user's familiarity with technical details.

### Contents
1. [Technical Requirements]
2. Using SSH
3. Cloning the Project
4. `.env` Configuration
5. Building and Running

# 1. Technical Requirements

## 1.1 The Server
We recommend using a Linux server for easy deployment with existing scripts in the project. The Linux distribution should be irrelevant, so long as it has Docker installed and has been granted SSH and HTTP access. Most of these steps can also be accomplished with Windows, but the details will differ. 

Hardware requirements are not much of a concern. We have not encountered serious lag or issues of any sort while using a VM with relatively low specs. The VM or device used should ideally have a good connection to campus wifi, virtually any CPU from the last 10 years, and at least a few GB of both disk/SSD storage and RAM. There are no graphics requirements for the server - the application only renders simple webpages on client browsers. We deployed using SSH with no graphical user interface without issue.

The only major requirement is that the Docker software is installed on the device.

## 1.2 The Deployer

The deployer need not be a particularly technical person, provided they can get access to a server or VM configured as described above. Familiarity with ssh, a terminal, and git would be ideal but are not necessary as this guide will walk the deployer through the required steps with each of these tools.

To begin deployment, the deployer must have access to their own computer, access to the git repository of the project on Github, and know the URL of the server machine. The deployer must be a user with remote access on the server and know their username and password on the system. The deployer does not necessarily need administrative privileges.

## 1.3 Notes

Before proceeding, please note the following:
- shell commands are denoted as `$ <name> <arguments>` - the dollar sign represents a command prompt symbol, and should not be literally entered along with the command

# 2. Using SSH

SSH, or 'secure shell', is a secure networking protocol commonly used to allow access to remote computer systems. We recommend it because it is simple and fairly universal to computers.

To connect to the server via SSH:
- start a terminal (Mac/Linux) or PowerShell (Windows)
- run the following command: `$ ssh <username>@<url>`, substituting `<username>` with your username on the server and `<url>` with the URL of the server
- provide a password if prompted
- you should be seeing another command prompt, possibly with some altered text that includes your username and the hostname of the machine, like so:
`joebob@sd-vm41.csc.ncsu.edu`

Here, `joebob` is the user, and `sd-vm41.csc.ncsu.edu` is the hostname of the server. If you see this, congratulations! You are officially "in".

# 3. Prepare SSH Keys



# 4. Clone the Repository

Now that you have access via SSH and cryptographic keys in-place, navigate to a folder location you would like to keep the project files in. For a fresh Linux server machine, we recommend `/srv/`, but if the deployer does not have admin privileges anywhere within their home directory (`~/`) should suffice.

For those unfamiliar with Linux/Unix commands, navigating file paths uses the command 

`$ cd <path>`

Once you have navigated to a suitable location, clone the project with 

`$ git clone <url> .` where `<url>` is the URL of the repository. This command will copy the repository contents into the current directory. If this directory is not empty or you otherwise wish the project code to go into a subdirectory instead, remove the `.` at the end of the command.

# 4. `.env` Configuration

# 5. Building and Running

