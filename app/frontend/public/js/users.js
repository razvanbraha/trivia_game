const userList = document.querySelector("#user-list");
const userTemplate = document.querySelector("#userDisplayTemplate");

const popup = document.querySelector("#popup")
const popupOpenButton = document.querySelector("#open-popup");
const popupCloseButton = document.querySelector("#close-popup")

popupOpenButton.addEventListener("click", () => {
    popup.classList.add("open");
    populateUsers();
});

popupCloseButton.addEventListener("click", () => {
    popup.classList.remove("open");
    clearUsers();
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
 * @author Razvan Braha
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
        userInstance.querySelector(".questionPriv").textContent = `Question Privelage: ${user.questionPriv ? "Yes" : "No"}`;
        userInstance.querySelector(".userPriv").textContent = `User Privelage: ${user.userPriv ? "Yes" : "No"}`;

        const deleteButton = document.createElement("button");
        deleteButton.className = "btn btn-danger";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => {
            deleteUser(user.userID);
        });

        userInstance.append(deleteButton);
        userList.append(userInstance);
    });
}

/**
 * Delete user from user database
 * @author Razvan Braha
 * @param {Number} id - id of user to delete
 * @throws Error if failed to delete user from db
 */
async function deleteUser(id) {
    const data = {userID: id};
    const res = await fetch("/api/users", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if (res.status !== 200) {
        const error = await res.json();
        console.log(error);
        return;
    }

    clearUsers();
    populateUsers();
}