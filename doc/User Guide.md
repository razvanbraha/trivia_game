# Introduction

### Contents
1. [Feature Overview](#1-feature-overview)
2. [Home Page](#2-home-page)
3. [Student Features](#3-student-features)
4. [Teacher Features](#4-teacher-features)
5. [Starting and Playing Games]($5-starting-and-playing-games)

# 1. Feature Overview

The Sustainable Trivia Game Application supports a collection of features for two primary user types: students and teachers.

Students can:
- join and participate in teacher-hosted trivia games
- start and play their own 'study' games

Teachers can:
- manage teacher users of the application
- manage questions that can appear in trivia games
- host 'teaching' games for a class

# 2. Home Page

The home page of the application allows new users to continue as a 'student' or continue as a 
'teacher'. Continuing as a student requires no login. However, continuing as a teacher requires the
user to authenticate with NCSU Shibboleth and pass the application's authorization to access teacher 
pages/features.

# 3. Student Features

When a user selects the "student" button from the home page, he is taken to the student dashboard
page. From here, students can select options to join an existing teacher-hosted game or to launch their own
study games. 

# 4. Teacher Features

When a user selects the "teacher" option from the home page, she is initially taken to NCSU's Shibboleth service
for authentication. After providing valid NCSU credentials, she must still pass our site's authorization to be 
allowed access to teacher pages. To pass authorization, she must be added as a 'user' to the application with
her unity ID.

Adding users is itself a feature limited to existing users with explicit privilege to do so; the first users are
added when the application software is built and should include any current developers of the application and
the main teacher user.

Users who have logged in and passed authorization will see the teacher dashboard page. It provides access to the 
following features:

### Hosting a Game

The user can launch a trivia game for multiple students to join. What happens after selecting this option is
discussed in the [game](#5-starting-and-playing-games) section below.

### Managing Questions

Selecting this option takes the user to a page for creating, editing, and deleting the questions that are 
stored in the application's database and can appear in games. Accessing this page requires the user to have
"question" privileges. On the left-hand pane, she can see 
existing questions and edit/delete them. On the right, she can fill out a form (optionally using AI) to
create new questions.

1. Creating Questions
	- Fill out the required fields on the form in the right-hand pane and click "submit". 
	- To automatically fill this form using AI, enter a prompt in the AI prompt field above the form.
	Under the hood, this calls into an external service with Google Gemini, and it will only work if 
	the application is configured with a valid 'key' (see the [developer guide](./Developer%20Guide.md) for information on configuring Gemini access) 
	- The AI will reject prompts that are not sufficiently on-topic for sustainable packaging, leaving 
	the form blank.
	- Questions are not created until the teacher manually selects submit. If you use AI, you can and 
	should review the details automatically entered into the form before submitting. 

2. Editing Questions
	- Scroll to the question in the left-hand pane and click "edit" in the lower right of the question card.
	- You can edit the content of the question and click "save" to update the question, or 
	"cancel" if you decide otherwise.
	- Questions that were initially created with AI are permanently identified, regardless of the 
	manual edits that follow. This is so you can flag these questions mentally for additional scrutiny.

3. Deleting Questions
	- Scroll to the question in the left-hand pane and
	click the "delete" button in the lower right.
	- IMPORTANT: this is a PERMANENT ACTION. The application does not store backups of the question data. Deleting should be done sparingly and with care.

### Managing Users

Selecting this option takes the user to a page where she can create, edit, and delete users (if she has the
privileges to do so). Similar to the "manage questions" page, this page is organized into two panes: a scrollable
list of existing users with buttons to edit/delete on the left, and a form for creating new users on the right.

Each user can have two privileges: user privilege and question privilege. User privilege allows a user 
to also create/edit other users, and should be restricted to the main teacher/administrator and developers. Some edits to existing users require
an additional administrative password for security.
Question privilege allows a user to create/edit questions. Users created with neither privilege can only launch
games. 

1. Creating New Users
	- Fill out the form on the right-hand pane and click submit. The "note" field is optional but recommended,
	since it can help the teacher remember who each user is and why they have teacher-level access to the
	application - this is a good place to note who is a developer or a TA.
	- IMPORTANT: follow good security principles when assigning privileges; users should have the minimum 
	amount of privilege needed to fulfill their role.

2. Editing Existing Users:
	- Scroll to the user on the left-hand pane and click "edit". You can then edit the fields of the user. 
	- You must have an administrative password to add/remove user privilege from other users.

3. Deleting Users:
	- Scroll to the user on the left-hand pane and click "delete". You will be prompted for an administrative
	password and cannot delete yourself.


# 5. Starting and Playing Games

When a host (a teacher starting a teaching game or a student starting a study game) chooses to launch a game, he is taken to a page where he can configure the game settings. 

### Before Starting

1. Editing Settings:
	- You can edit various game settings with sliders/checkboxes.
2. Kicking Players:
	- On the teaching game, the joined players are listed on the right side.
	- Click the "kick" button attached to a player.

### After Starting

