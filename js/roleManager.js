// ============================================================
// AGRICONNECT ROLE MANAGER
// ============================================================

const RoleManager = (() => {

  // ----------------------------------------------------------
  // GET USER
  // ----------------------------------------------------------

  function getUser() {
    try {
      return JSON.parse(
        localStorage.getItem("user") || "null"
      );
    } catch (error) {
      console.error(
        "Failed to read user:",
        error
      );

      return null;
    }
  }


  // ----------------------------------------------------------
  // GET TOKEN
  // ----------------------------------------------------------

  function getToken() {
    return localStorage.getItem("token");
  }


  // ----------------------------------------------------------
  // GET AVAILABLE ROLES
  // ----------------------------------------------------------

  function getRoles() {

    const user = getUser();

    if (!user || !Array.isArray(user.roles)) {
      return [];
    }

    return user.roles.filter(
      role => role.status === "active"
    );
  }


  // ----------------------------------------------------------
  // GET ROLE NAMES
  // ----------------------------------------------------------

  function getRoleNames() {

    return getRoles().map(
      role => role.role.toLowerCase()
    );
  }


  // ----------------------------------------------------------
  // CHECK WHETHER USER HAS ROLE
  // ----------------------------------------------------------

  function hasRole(role) {

    const normalizedRole =
      role.toLowerCase();

    return getRoleNames().includes(
      normalizedRole
    );
  }


  // ----------------------------------------------------------
  // GET CURRENT ACTIVE ROLE
  // ----------------------------------------------------------

  function getActiveRole() {

    const availableRoles =
      getRoleNames();

    if (availableRoles.length === 0) {
      return null;
    }


    const storedRole =
      localStorage.getItem("activeRole");


    // --------------------------------------------------------
    // Make sure stored role is still available
    // --------------------------------------------------------

    if (
      storedRole &&
      availableRoles.includes(
        storedRole.toLowerCase()
      )
    ) {
      return storedRole.toLowerCase();
    }


    // --------------------------------------------------------
    // Use user's default role
    // --------------------------------------------------------

    const user = getUser();

    if (user && user.roles) {

      const defaultRole =
        user.roles.find(
          role => role.isDefault === true &&
                   role.status === "active"
        );

      if (defaultRole) {

        const role =
          defaultRole.role.toLowerCase();

        localStorage.setItem(
          "activeRole",
          role
        );

        return role;
      }
    }


    // --------------------------------------------------------
    // Fallback
    // --------------------------------------------------------

    const fallback =
      availableRoles[0];

    localStorage.setItem(
      "activeRole",
      fallback
    );

    return fallback;
  }


  // ----------------------------------------------------------
  // SET ACTIVE ROLE
  // ----------------------------------------------------------

  function setActiveRole(role) {

    const normalizedRole =
      role.toLowerCase();


    if (!hasRole(normalizedRole)) {

      console.error(
        `Cannot activate role "${normalizedRole}".`
      );

      return false;
    }


    localStorage.setItem(
      "activeRole",
      normalizedRole
    );

    return true;
  }


  // ----------------------------------------------------------
  // SWITCH ROLE
  // ----------------------------------------------------------

  function switchRole(role) {

    const success =
      setActiveRole(role);

    if (!success) {
      return false;
    }


    switch (
      role.toLowerCase()
    ) {

      case "farmer":

        window.location.href =
          "../dashboard/farmer.html";

        break;


      case "expert":

        window.location.href =
          "../dashboard/expert.html";

        break;


      case "buyer":

        window.location.href =
          "../dashboard/buyer.html";

        break;


      case "supplier":

        window.location.href =
          "../dashboard/supplier.html";

        break;


      default:

        console.error(
          "Unknown role:",
          role
        );

        return false;
    }


    return true;
  }


  // ----------------------------------------------------------
  // REQUIRE ROLE
  // ----------------------------------------------------------

  function requireRole(role) {

    const user = getUser();
    const token = getToken();

    if (!user || !token) {

      window.location.href =
        "../pages/login.html";

      return false;
    }


    if (!hasRole(role)) {

      console.error(
        `User does not have the ${role} role.`
      );

      window.location.href =
        "../pages/select-role.html";

      return false;
    }


    // Set the current workspace
    setActiveRole(role);

    return true;
  }


  // ----------------------------------------------------------
  // LOGOUT
  // ----------------------------------------------------------

  function logout() {

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeRole");

    window.location.href =
      "../pages/login.html";
  }


  // ----------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------

 return {

  getUser,
  getToken,
  getRoles,
  getRoleNames,
  hasRole,
  getActiveRole,
  setActiveRole,
  switchRole,
  requireRole,
  updateUser,
  logout

};

})();

// ----------------------------------------------------------
// UPDATE LOCAL USER
// ----------------------------------------------------------

function updateUser(updatedUser) {

  if (!updatedUser) {
    return null;
  }

  const currentUser =
    getUser() || {};

  const mergedUser = {
    ...currentUser,
    ...updatedUser
  };

  localStorage.setItem(
    "user",
    JSON.stringify(mergedUser)
  );

  return mergedUser;
}

// ----------------------------------------------------------
// REFRESH USER DATA FROM BACKEND
// ----------------------------------------------------------

async function refreshUser() {

  const token = getToken();

  if (!token) {
    return null;
  }

  try {

    const response = await fetch(
      `${API_BASE_URL}/auth/me`,
      {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {

      throw new Error(
        data.error ||
        data.message ||
        "Failed to refresh account information."
      );

    }

    const updatedUser =
      data.user || data;

    localStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );

    return updatedUser;

  } catch (error) {

    console.error(
      "REFRESH USER ERROR:",
      error
    );

    return null;
  }
}