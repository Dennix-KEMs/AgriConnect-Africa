// =====================================================
// AGRICONNECT AFRICA
// SUPER ADMIN - ADMINISTRATOR MANAGEMENT
// =====================================================

const token =
    localStorage.getItem("token");


// =====================================================
// AUTH CHECK
// =====================================================

if (!token) {

    window.location.href =
        "../pages/login.html";

}


// =====================================================
// STATE
// =====================================================

let administrators = [];

let selectedAdministrator = null;

let availablePermissions = [];

let selectedPasswordAdministrator = null;


// =====================================================
// API HELPER
// =====================================================

async function apiRequest(
    url,
    options = {}
) {

    const response =
    await fetch(
        `http://localhost:5000${url}`,
        {
            ...options,

            cache: "no-store",

                headers: {

                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${token}`,

                    ...(options.headers || {})

                }

            }
        );


    const contentType =
    response.headers.get("content-type") || "";

let data = null;

if (
    contentType.includes("application/json")
) {

    data =
        await response.json();

} else {

    const text =
        await response.text();

    data = {
        error:
            text ||
            `Request failed with status ${response.status}.`
    };

}


if (!response.ok) {

    throw new Error(
        data?.error ||
        `Request failed with status ${response.status}.`
    );

}


return data;

}


// =====================================================
// LOAD ADMINISTRATORS
// =====================================================

async function loadAdministrators() {

    const tbody =
        document.querySelector(
            "#administratorsTable tbody"
        );


    try {

        const data =
            await apiRequest(
                "/api/admin/administrators"
            );


        administrators =
            data.administrators || [];


        renderAdministrators();


    } catch (error) {

        console.error(
            "LOAD ADMINISTRATORS ERROR:",
            error
        );


        tbody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="error-message"
                >
                    Failed to load administrators.
                </td>

            </tr>

        `;

    }

}


// =====================================================
// RENDER ADMINISTRATORS
// =====================================================

function renderAdministrators() {

    const tbody =
        document.querySelector(
            "#administratorsTable tbody"
        );


    tbody.innerHTML = "";


    if (
        administrators.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    style="text-align:center;"
                >
                    No administrators found.
                </td>

            </tr>

        `;

        return;

    }


    administrators.forEach(
        admin => {

            const row =
                document.createElement(
                    "tr"
                );


            const status =
                Number(
                    admin.is_active
                ) === 1;


            row.innerHTML = `

                <td>
                    <strong>
                        ${escapeHtml(
                            admin.fullName
                        )}
                    </strong>
                </td>

                <td>
                    ${escapeHtml(
                        admin.email
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        admin.phone ||
                        "—"
                    )}
                </td>

                <td>

                    <span class="admin-level">

                        ${
                            admin.admin_level ===
                            "super_admin"

                                ? "Super Admin"

                                : "Administrator"
                        }

                    </span>

                </td>

                <td>

                    <span
                        class="status ${
                            status
                                ? "active"
                                : "suspended"
                        }"
                    >

                        ${
                            status
                                ? "Active"
                                : "Inactive"
                        }

                    </span>

                </td>

                <td>

                    ${
                        admin.admin_level ===
                        "super_admin"

                            ? "Full Access"

                            : "Manage Permissions"
                    }

                </td>

                <td>

                    ${

    admin.admin_level !==
    "super_admin"

        ? `

            <button
                class="admin-action-btn"
                onclick="openPermissions(${admin.admin_access_id})"
            >
                Permissions
            </button>


            <button
    class="admin-action-btn"
    onclick="openResetPassword(${admin.admin_access_id})"
>
    Reset Password
</button>


            <button
                class="admin-action-btn"
                onclick="toggleAdministratorStatus(
                    ${admin.admin_access_id},
                    ${status}
                )"
            >
                ${
                    status
                        ? "Deactivate"
                        : "Activate"
                }
            </button>

        `

        : `

            <span>
                Protected
            </span>

        `

}

                </td>

            `;


            tbody.appendChild(
                row
            );

        }
    );

}


// =====================================================
// OPEN PERMISSIONS
// =====================================================

async function openPermissions(adminAccessId) {

    try {

        console.log(
            "OPENING PERMISSIONS FOR ADMIN ACCESS ID:",
            adminAccessId
        );


        const admin =
            administrators.find(
                item =>
                    Number(item.admin_access_id) ===
                    Number(adminAccessId)
            );


        console.log(
            "ADMIN ACCESS FOUND:",
            admin
        );


        if (!admin) {

            console.error(
                "Administrator not found:",
                adminAccessId,
                administrators
            );

            showPermissionMessage(
                "Administrator not found.",
                "error"
            );

            return;

        }


        selectedAdministrator =
            admin;


        document.getElementById(
            "permissionPanel"
        ).style.display = "block";


        document.getElementById(
            "permissionAdminName"
        ).textContent =
            `Managing permissions for ${admin.fullName}`;


        await loadPermissions(
            admin.admin_access_id
        );


        document.getElementById(
            "permissionPanel"
        ).scrollIntoView({
            behavior: "smooth"
        });


    } catch (error) {

        console.error(
            "OPEN PERMISSIONS ERROR:",
            error
        );

        showPermissionMessage(
            error.message,
            "error"
        );

    }

}

// =====================================================
// LOAD ALL PERMISSIONS + ASSIGNED PERMISSIONS
// =====================================================

async function loadPermissions(adminAccessId) {

    const container =
        document.getElementById(
            "permissionsContainer"
        );


    container.innerHTML = `

        <p class="loading-message">
            Loading permissions...
        </p>

    `;


    try {

        // ---------------------------------------------
        // GET AVAILABLE PERMISSIONS
        // ---------------------------------------------

        const permissionsData =
            await apiRequest(
                "/api/admin/administrator-permissions"
            );


        availablePermissions =
            permissionsData.permissions || [];


        // ---------------------------------------------
        // GET ASSIGNED PERMISSIONS
        // ---------------------------------------------

        const assignedData =
    await apiRequest(
        `/api/admin/administrators/${adminAccessId}/permissions`
    );


        const assigned =
            assignedData.permissions || [];


        const assignedKeys =
            assigned.map(
                permission =>
                    permission.permission_key
            );


        renderPermissions(
            assignedKeys
        );


    } catch (error) {

        console.error(
            "LOAD PERMISSIONS ERROR:",
            error
        );


        container.innerHTML = `

            <p class="error-message">
                ${escapeHtml(
                    error.message
                )}
            </p>

        `;

    }

}


// =====================================================
// RENDER PERMISSIONS
// =====================================================

function renderPermissions(
    assignedKeys
) {

    const container =
        document.getElementById(
            "permissionsContainer"
        );


    container.innerHTML = "";


    availablePermissions.forEach(
        permission => {

            const checked =
                assignedKeys.includes(
                    permission.permission_key
                );


            const card =
                document.createElement(
                    "label"
                );


            card.className =
                "permission-card";


            card.innerHTML = `

                <input
                    type="checkbox"
                    value="${escapeHtml(
                        permission.permission_key
                    )}"
                    ${
                        checked
                            ? "checked"
                            : ""
                    }
                >

                <div>

                    <strong>
                        ${escapeHtml(
                            permission.permission_name
                        )}
                    </strong>

                    <p>
                        ${escapeHtml(
                            permission.description ||
                            ""
                        )}
                    </p>

                </div>

            `;


            container.appendChild(
                card
            );

        }
    );

}


// =====================================================
// SAVE PERMISSIONS
// =====================================================

async function savePermissions() {

    if (!selectedAdministrator) {

        return;

    }


    const checkboxes =
        document.querySelectorAll(
            "#permissionsContainer input[type='checkbox']"
        );


    const permissions = [];


    checkboxes.forEach(
        checkbox => {

            if (checkbox.checked) {

                permissions.push(
                    checkbox.value
                );

            }

        }
    );


    const button =
        document.getElementById(
            "savePermissionsBtn"
        );


    button.disabled = true;

    button.textContent =
        "Saving...";


    try {

        console.log(
            "SAVING ADMIN PERMISSIONS:",
            {
                name:
                    selectedAdministrator.fullName,

                adminAccountId:
                    selectedAdministrator.admin_account_id,

                adminAccessId:
                    selectedAdministrator.admin_access_id,

                permissions
            }
        );


        await apiRequest(
            `/api/admin/administrators/${selectedAdministrator.admin_access_id}/permissions`,
            {
                method: "PUT",

                body:
                    JSON.stringify({
                        permissions
                    })
            }
        );


        showPermissionMessage(
            "Permissions updated successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "SAVE PERMISSIONS ERROR:",
            error
        );


        showPermissionMessage(
            error.message,
            "error"
        );


    } finally {

        button.disabled = false;

        button.textContent =
            "Save Permissions";

    }

}


// =====================================================
// TOGGLE ADMINISTRATOR STATUS
// =====================================================

async function toggleAdministratorStatus(
    adminAccessId,
    currentlyActive
) {

    const action =
        currentlyActive
            ? "deactivate"
            : "activate";


    const confirmed =
        confirm(
            `Are you sure you want to ${action} this administrator?`
        );


    if (!confirmed) {

        return;

    }


    try {

        await apiRequest(
    `/api/admin/administrators/${adminAccessId}/status`,
    {
        method: "PATCH",

        body: JSON.stringify({
            isActive:
                currentlyActive
                    ? false
                    : true,

            reason:
                `Administrator status changed by Super Admin.`
        })
    }
);


        await loadAdministrators();


    } catch (error) {

        console.error(
            "TOGGLE ADMIN STATUS ERROR:",
            error
        );


        alert(
            error.message
        );

    }

}


// =====================================================
// CREATE ADMINISTRATOR
// =====================================================

async function createAdministrator(
    event
) {

    event.preventDefault();


    const errorBox =
        document.getElementById(
            "createAdministratorError"
        );


    errorBox.textContent = "";


    const fullName =
        document.getElementById(
            "adminFullName"
        ).value.trim();


    const email =
        document.getElementById(
            "adminEmail"
        ).value.trim();


    const phone =
        document.getElementById(
            "adminPhone"
        ).value.trim();


    const password =
        document.getElementById(
            "adminPassword"
        ).value;


    try {

        await apiRequest(
            "/api/admin/administrators",
            {
                method: "POST",

                body:
                    JSON.stringify({

                        fullName,

                        email,

                        phone,

                        password

                    })

            }
        );


        closeCreateAdministratorModal();


        document.getElementById(
            "createAdministratorForm"
        ).reset();


        await loadAdministrators();


        showAdministratorMessage(
            "Administrator created successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "CREATE ADMINISTRATOR ERROR:",
            error
        );


        errorBox.textContent =
            error.message;

    }

}


// =====================================================
// MODAL
// =====================================================

function openCreateAdministratorModal() {

    document.getElementById(
        "createAdministratorModal"
    ).style.display = "flex";

}


function closeCreateAdministratorModal() {

    document.getElementById(
        "createAdministratorModal"
    ).style.display = "none";

}


// =====================================================
// MESSAGES
// =====================================================

function showAdministratorMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "administratorMessage"
        );


    element.textContent =
        message;


    element.className =
        `admin-message ${type}`;


    setTimeout(
        () => {

            element.textContent = "";

        },
        4000
    );

}


function showPermissionMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "permissionMessage"
        );


    element.textContent =
        message;


    element.className =
        `admin-message ${type}`;

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


// =====================================================
// EVENT LISTENERS
// =====================================================

document
    .getElementById(
        "createAdministratorBtn"
    )
    ?.addEventListener(
        "click",
        openCreateAdministratorModal
    );


document
    .getElementById(
        "closeCreateAdministratorBtn"
    )
    ?.addEventListener(
        "click",
        closeCreateAdministratorModal
    );


document
    .getElementById(
        "cancelCreateAdministratorBtn"
    )
    ?.addEventListener(
        "click",
        closeCreateAdministratorModal
    );


document
    .getElementById(
        "createAdministratorForm"
    )
    ?.addEventListener(
        "submit",
        createAdministrator
    );


document
    .getElementById(
        "savePermissionsBtn"
    )
    ?.addEventListener(
        "click",
        savePermissions
    );


document
    .getElementById(
        "cancelPermissionsBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            document.getElementById(
                "permissionPanel"
            ).style.display = "none";

            selectedAdministrator =
                null;

        }
    );


document
    .getElementById(
        "backToDashboardBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "../dashboard/admin.html";

        }
    );



    // =====================================================
// RESET ADMINISTRATOR PASSWORD
// =====================================================

function openResetAdministratorPassword(
    adminAccessId
) {

    const admin =
        administrators.find(
            item =>
                Number(
                    item.admin_access_id
                ) ===
                Number(
                    adminAccessId
                )
        );


    if (!admin) {

        alert(
            "Administrator not found."
        );

        return;

    }


    selectedAdministrator =
        admin;


    const modal =
        document.getElementById(
            "resetAdministratorPasswordModal"
        );


    const nameElement =
        document.getElementById(
            "resetAdministratorName"
        );


    const errorBox =
        document.getElementById(
            "resetAdministratorPasswordError"
        );


    const form =
        document.getElementById(
            "resetAdministratorPasswordForm"
        );


    if (!modal) {

        return;

    }


    form?.reset();


    errorBox.textContent =
        "";


    nameElement.textContent =
        `Resetting password for ${admin.fullName} (${admin.email})`;


    modal.style.display =
        "flex";

}


// =====================================================
// CLOSE RESET PASSWORD MODAL
// =====================================================

function closeResetAdministratorPassword() {

    const modal =
        document.getElementById(
            "resetAdministratorPasswordModal"
        );


    if (!modal) {

        return;

    }


    modal.style.display =
        "none";


    document
        .getElementById(
            "resetAdministratorPasswordForm"
        )
        ?.reset();


    document
        .getElementById(
            "resetAdministratorPasswordError"
        ).textContent =
        "";


    selectedAdministrator =
        null;

}


// =====================================================
// SUBMIT RESET PASSWORD
// =====================================================

async function resetAdministratorPassword(
    event
) {

    event.preventDefault();


    if (!selectedAdministrator) {

        return;

    }


    const newPassword =
        document.getElementById(
            "resetAdminPassword"
        ).value;


    const confirmPassword =
        document.getElementById(
            "resetAdminConfirmPassword"
        ).value;


    const errorBox =
        document.getElementById(
            "resetAdministratorPasswordError"
        );


    const button =
        document.getElementById(
            "resetAdministratorPasswordBtn"
        );


    errorBox.textContent =
        "";


    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (
        newPassword.length <
        8
    ) {

        errorBox.textContent =
            "Password must contain at least 8 characters.";

        return;

    }


    if (
        newPassword !==
        confirmPassword
    ) {

        errorBox.textContent =
            "Passwords do not match.";

        return;

    }


    // -------------------------------------------------
    // CONFIRM
    // -------------------------------------------------

    const confirmed =
        confirm(
            `Are you sure you want to reset the password for ${selectedAdministrator.fullName}?`
        );


    if (!confirmed) {

        return;

    }


    button.disabled =
        true;

    button.textContent =
        "Resetting...";


    try {

        await apiRequest(
            `/api/admin/administrators/${selectedAdministrator.admin_access_id}/password`,
            {
                method:
                    "PATCH",

                body:
                    JSON.stringify({

                        newPassword

                    })

            }
        );


        const administratorName =
    selectedAdministrator.fullName;


closeResetAdministratorPassword();


showAdministratorMessage(
    `Password for ${administratorName} was reset successfully.`,
    "success"
);


    } catch (error) {

        console.error(
            "RESET ADMINISTRATOR PASSWORD ERROR:",
            error
        );


        errorBox.textContent =
            error.message ||
            "Failed to reset administrator password.";

    } finally {

        button.disabled =
            false;

        button.textContent =
            "Reset Password";

    }

}


// =====================================================
// PASSWORD VISIBILITY
// =====================================================

document
    .querySelectorAll(
        "#resetAdministratorPasswordModal .toggle-password"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const target =
                        document.getElementById(
                            button.dataset.target
                        );


                    if (!target) {

                        return;

                    }


                    if (
                        target.type ===
                        "password"
                    ) {

                        target.type =
                            "text";

                        button.textContent =
                            "🙈";

                    } else {

                        target.type =
                            "password";

                        button.textContent =
                            "👁";

                    }

                }
            );

        }
    );


// =====================================================
// PASSWORD MATCH
// =====================================================

document
    .getElementById(
        "resetAdminConfirmPassword"
    )
    ?.addEventListener(
        "input",
        () => {

            const password =
                document.getElementById(
                    "resetAdminPassword"
                ).value;


            const confirmation =
                document.getElementById(
                    "resetAdminConfirmPassword"
                ).value;


            const message =
                document.getElementById(
                    "resetPasswordMatchMessage"
                );


            if (!confirmation) {

                message.textContent =
                    "";

                return;

            }


            if (
                password ===
                confirmation
            ) {

                message.textContent =
                    "✓ Passwords match";

                message.className =
                    "password-match-message valid";

            } else {

                message.textContent =
                    "Passwords do not match";

                message.className =
                    "password-match-message invalid";

            }

        }
    );


// =====================================================
// RESET PASSWORD EVENTS
// =====================================================

document
    .getElementById(
        "closeResetAdministratorPasswordBtn"
    )
    ?.addEventListener(
        "click",
        closeResetAdministratorPassword
    );


document
    .getElementById(
        "cancelResetAdministratorPasswordBtn"
    )
    ?.addEventListener(
        "click",
        closeResetAdministratorPassword
    );


document
    .getElementById(
        "resetAdministratorPasswordForm"
    )
    ?.addEventListener(
        "submit",
        resetAdministratorPassword
    );

    // =====================================================
// PASSWORD REQUIREMENT CHECKER
// =====================================================

function checkPasswordRequirements(password) {

    const requirements = {

        length:
            password.length >= 10,

        uppercase:
            /[A-Z]/.test(password),

        lowercase:
            /[a-z]/.test(password),

        number:
            /[0-9]/.test(password),

        special:
            /[^A-Za-z0-9]/.test(password)

    };


    document
        .getElementById("adminReqLength")
        ?.classList.toggle(
            "valid",
            requirements.length
        );


    document
        .getElementById("adminReqUppercase")
        ?.classList.toggle(
            "valid",
            requirements.uppercase
        );


    document
        .getElementById("adminReqLowercase")
        ?.classList.toggle(
            "valid",
            requirements.lowercase
        );


    document
        .getElementById("adminReqNumber")
        ?.classList.toggle(
            "valid",
            requirements.number
        );


    document
        .getElementById("adminReqSpecial")
        ?.classList.toggle(
            "valid",
            requirements.special
        );


    const valid =
        requirements.length &&
        requirements.uppercase &&
        requirements.lowercase &&
        requirements.number &&
        requirements.special;


    const button =
        document.getElementById(
            "resetAdministratorPasswordBtn"
        );


    if (button) {

        button.disabled =
            !valid;

    }


    return valid;

}

// =====================================================
// OPEN RESET PASSWORD
// =====================================================

function openResetPassword(adminAccessId) {

    const admin =
        administrators.find(
            item =>
                Number(item.admin_access_id) ===
                Number(adminAccessId)
        );


    if (!admin) {

        alert(
            "Administrator not found."
        );

        return;

    }


    if (
        admin.admin_level ===
        "super_admin"
    ) {

        alert(
            "The Super Admin account is protected."
        );

        return;

    }


    selectedPasswordAdministrator =
        admin;


    const nameElement =
        document.getElementById(
            "resetPasswordAdminName"
        );


    const modal =
        document.getElementById(
            "resetAdministratorPasswordModal"
        );


    const passwordInput =
        document.getElementById(
            "administratorNewPassword"
        );


    const errorBox =
        document.getElementById(
            "resetAdministratorPasswordError"
        );


    if (
        !nameElement ||
        !modal ||
        !passwordInput ||
        !errorBox
    ) {

        console.error(
            "RESET PASSWORD MODAL: Required HTML elements are missing."
        );

        alert(
            "Reset password interface could not be loaded. Please refresh the page."
        );

        return;

    }


    nameElement.textContent =
        `Resetting password for ${admin.fullName}`;


    passwordInput.value = "";


    errorBox.textContent = "";


    checkPasswordRequirements("");


    modal.style.display = "flex";

}

// =====================================================
// RESET ADMINISTRATOR PASSWORD
// =====================================================

async function resetAdministratorPassword(event) {

    event.preventDefault();


    if (
        !selectedPasswordAdministrator
    ) {

        return;

    }


    const password =
        document.getElementById(
            "administratorNewPassword"
        ).value;


    if (
        !checkPasswordRequirements(password)
    ) {

        return;

    }


    const errorBox =
        document.getElementById(
            "resetAdministratorPasswordError"
        );


    const button =
        document.getElementById(
            "resetAdministratorPasswordBtn"
        );


    errorBox.textContent = "";


    button.disabled = true;

    button.textContent =
        "Resetting...";


    try {

        await apiRequest(

            `/api/admin/administrators/${selectedPasswordAdministrator.admin_access_id}/password`,

            {

                method: "PATCH",

                body:
                    JSON.stringify({
                        newPassword:
                            password
                    })

            }

        );


        closeResetPasswordModal();


        showAdministratorMessage(
            "Administrator password reset successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "RESET ADMINISTRATOR PASSWORD ERROR:",
            error
        );


        errorBox.textContent =
            error.message;


        button.disabled =
            false;

        button.textContent =
            "Reset Password";

    }

}

// =====================================================
// RESET PASSWORD MODAL
// =====================================================

function closeResetPasswordModal() {

    document.getElementById(
        "resetAdministratorPasswordModal"
    ).style.display = "none";


    document.getElementById(
        "resetAdministratorPasswordForm"
    ).reset();


    selectedPasswordAdministrator =
        null;


    checkPasswordRequirements("");

}

document
    .getElementById(
        "closeResetPasswordBtn"
    )
    ?.addEventListener(
        "click",
        closeResetPasswordModal
    );


document
    .getElementById(
        "cancelResetPasswordBtn"
    )
    ?.addEventListener(
        "click",
        closeResetPasswordModal
    );


document
    .getElementById(
        "resetAdministratorPasswordForm"
    )
    ?.addEventListener(
        "submit",
        resetAdministratorPassword
    );


document
    .getElementById(
        "administratorNewPassword"
    )
    ?.addEventListener(
        "input",
        event => {

            checkPasswordRequirements(
                event.target.value
            );

        }
    );


// =====================================================
// INITIALIZE
// =====================================================

loadAdministrators();