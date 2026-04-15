const userList = document.querySelector("#user-list");
const userTemplate = document.querySelector("#userDisplayTemplate");

const popup = document.querySelector("#popup")
const popupOpenButton = document.querySelector("#open-popup");
const popupCloseButton = document.querySelector("#close-popup")

const form = document.querySelector("#userForm")
const editContainer = document.querySelector("#edit-user-container");
const editForm = document.querySelector("#editUserForm");

const editUserID = document.querySelector("#editUserID");
const editUnityID = document.querySelector("#editUnityID");
const editNote = document.querySelector('#editNote');
const editQuestionPriv = document.querySelector("#editQuestionPriv");
const editUserPriv = document.querySelector("#editUserPriv");

const cancelEditBtn = document.querySelector("#cancelEdit");

popupOpenButton.addEventListener("click", () => {
    popup.classList.add("open");
    populateUsers();
});

popupCloseButton.addEventListener("click", () => {
    popup.classList.remove("open");
    clearUsers();
});

/**
 * Hides edit form without saving changes
 * @author David Salinas
 */
cancelEditBtn.addEventListener("click", () => {
    editContainer.style.display = "none";
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const adminPassword = prompt("Enter password:");
    if(!adminPassword) {
        alert("Password required");
        return;
    }

   const data = {
        unityID: document.querySelector("#unityID").value,
        note: document.querySelector("#note").value,
        questionPriv: document.querySelector("#questionPriv").checked,
        userPriv: document.querySelector("#userPriv").checked,
        adminPassword
    };

    const res = await fetch("/api/users", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const err = await res.json();
        alert(err.error);
        return;
    }

    alert("User added");
    form.reset();
});

/**
 * Submit edited user data to backend
 * Sends PUT request to update user information
 * @author David Salinas
 * @event submit
 * @param {Event} e - form submission event
 * @throws Error if request fails or user lacks permissions
 */
editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const adminPassword = prompt("Enter admin password:");
    if (!adminPassword) return;

    const res = await fetch("/api/users", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            userID: editUserID.value,
            unityID: editUnityID.value,
            questionPriv: editQuestionPriv.checked,
            userPriv: editUserPriv.checked,
            adminPassword
        })
    });

    if (!res.ok) {
        const err = await res.json();
        alert(err.error);
        return;
    }

    alert("User updated");

    editContainer.style.display = "none";
    populateUsers();
});

/**
 * Clear user list
 * @author Razvan Braha
 */
function clearUsers() {
    userList.replaceChildren();
}

/**
 * Populate user list from users database
 * Attaches Delete and Edit buttons
 * @author Razvan Braha & David Salinas
 * @throws Error if failed to fetch users from db
 */
async function populateUsers() {
    clearUsers();

    const res = await fetch("/api/users");
    if (res.status !== 200) {
        const error = await res.json();
        console.log(error);
        return;
    }

    const users = await res.json();
    users.forEach((user) => {
        const userInstance = userTemplate.content.cloneNode("true");

        userInstance.querySelector(".userID").textContent = `User ID: ${user.userID}`;
        userInstance.querySelector(".unityID").textContent = `Unity ID: ${user.unityID}`;
        userInstance.querySelector(".note").textContent = `Note: ${user.note}`;
        userInstance.querySelector(".questionPriv").textContent = `Question Privilege: ${user.questionPriv ? "Yes" : "No"}`;
        userInstance.querySelector(".userPriv").textContent = `User Privilege: ${user.userPriv ? "Yes" : "No"}`;

        const deleteButton = document.createElement("button");
        deleteButton.className = "btn btn-danger";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", async () => {
            const adminPassword = prompt("Enter admin password:");
            if (!adminPassword) return;

            const res = await fetch("/api/users", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userID: user.userID,
                    unityID: user.unityID,
                    adminPassword
                })
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error);
                return;
            }

            populateUsers();
        });

        const editButton = document.createElement("button");
        editButton.className = "btn btn-warning ms-2";
        editButton.textContent = "Edit";

        /**
         * Displays edit form and pre-fills with selected user's data
         * @author David Salinas
         * @param {Object} user - user object from database
         */
        editButton.addEventListener("click", () => {
            editContainer.style.display = "block";

            editUserID.value = user.userID;
            editUnityID.value = user.unityID;
            editNote.value = user.note;
            editQuestionPriv.checked = user.questionPriv;
            editUserPriv.checked = user.userPriv;

            editContainer.scrollIntoView({ behavior: "smooth" });
        });

        userInstance.append(deleteButton);
        userInstance.append(editButton);
        userList.append(userInstance);
    });
}