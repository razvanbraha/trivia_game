const userListContent = document.querySelector("#userListContent");
const displayTemplate = document.querySelector("#userDisplayTemplate");
const editTemplate = document.querySelector("#userEditTemplate");
const createForm = document.querySelector("#userForm");

// Initial Load
document.addEventListener("DOMContentLoaded", populateUsers);

async function populateUsers() {
    userListContent.innerHTML = ""; // Clear list
    
    const res = await fetch("/api/users");
    if (!res.ok) return console.error("Failed to fetch users");

    const users = await res.json();
    users.forEach(user => {
        const userRow = document.createElement("div");
        userRow.dataset.userid = user.userID;
        renderUserDisplay(userRow, user);
        userListContent.appendChild(userRow);
    });
}

// Renders the read-only view
function renderUserDisplay(container, user) {
    container.innerHTML = "";
    const instance = displayTemplate.content.cloneNode(true);

    instance.querySelector(".unityID").textContent = user.unityID;
    instance.querySelector(".userID").textContent = `ID: ${user.userID}`;
    instance.querySelector(".note").textContent = user.note || "No notes.";
    instance.querySelector(".privileges").textContent = 
        `Privileges: Question [${user.questionPriv ? '✓' : '✗'}] User: [${user.userPriv ? '✓' : '✗'}]`;

    instance.querySelector(".edit-btn").onclick = () => renderUserEdit(container, user);
    
    instance.querySelector(".delete-btn").onclick = () => deleteUser(user);

    container.appendChild(instance);
}

// Renders the in-place edit form
function renderUserEdit(container, user) {
    container.innerHTML = "";
    const instance = editTemplate.content.cloneNode(true);

    instance.querySelector(".edit-unity-label").textContent = `Editing: ${user.unityID}`;
    const noteInput = instance.querySelector(".edit-note-input");
    const qPriv = instance.querySelector(".edit-q-priv");
    const uPriv = instance.querySelector(".edit-u-priv");

    // Pre-fill
    noteInput.value = user.note || "";
    qPriv.checked = user.questionPriv;
    uPriv.checked = user.userPriv;

    // Cancel logic
    instance.querySelector(".cancel-btn").onclick = () => renderUserDisplay(container, user);

    // Save logic
    instance.querySelector(".edit-user-form").onsubmit = async (e) => {
        e.preventDefault();
        const adminPassword = prompt("Enter admin password:");
        if (!adminPassword) return;

        const updatedData = {
            userID: user.userID,
            unityID: user.unityID, // Kept for backend validation
            note: noteInput.value,
            questionPriv: qPriv.checked,
            userPriv: uPriv.checked,
            adminPassword
        };

        const res = await fetch("/api/users", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedData)
        });

        if (res.ok) {
            alert("User updated!");
            // Re-render display with NEW values
            renderUserDisplay(container, { ...user, ...updatedData });
        } else {
            const err = await res.json();
            alert(err.error);
        }
    };

    container.appendChild(instance);
}

async function deleteUser(user) {
    const adminPassword = prompt("Enter admin password:");
    if (!adminPassword) return;

    const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID: user.userID, unityID: user.unityID, adminPassword })
    });

    if (res.ok) {
        populateUsers();
    } else {
        const err = await res.json();
        alert(err.error);
    }
}

// Create Form logic remains mostly the same, but calls populateUsers on success
createForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const adminPassword = prompt("Enter password:");
    if(!adminPassword) return;

    const data = {
        unityID: document.querySelector("#unityID").value,
        note: document.querySelector("#note").value,
        questionPriv: document.querySelector("#questionPriv").checked,
        userPriv: document.querySelector("#userPriv").checked,
        adminPassword
    };

    const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    if (res.ok) {
        createForm.reset();
        populateUsers();
    } else {
        const err = await res.json();
        alert(err.error);
    }
});