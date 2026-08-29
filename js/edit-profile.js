const form =
document.getElementById(
  "profileForm"
);

const message =
document.getElementById(
  "message"
);

loadProfile();

async function loadProfile() {

  try {

    const user =
      JSON.parse(
        localStorage.getItem("user")
      );

    const response =
      await fetch(
        `http://localhost:5000/api/users/profile/${user.id}`,
        {
          headers: {
            Authorization:
              `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

    const profile =
      await response.json();

    document.getElementById("fullName").value =
      profile.fullName || "";

    document.getElementById("phone").value =
      profile.phone || "";

    document.getElementById("county").value =
      profile.county || "";

    document.getElementById("subcounty").value =
      profile.subcounty || "";

    document.getElementById("ward").value =
      profile.ward || "";

    document.getElementById("business_name").value =
      profile.business_name || "";

    document.getElementById("farm_type").value =
      profile.farm_type || "";

    document.getElementById("crops").value =
      profile.crops || "";

    document.getElementById("livestock").value =
      profile.livestock || "";

    document.getElementById("specialization").value =
      profile.specialization || "";

    document.getElementById("bio").value =
      profile.bio || "";

  } catch(error) {

    console.error(error);

  }
}

form.addEventListener(
  "submit",
  updateProfile
);

async function updateProfile(e) {

  e.preventDefault();

  try {

    const response =
      await fetch(
        "http://localhost:5000/api/users/profile",
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${localStorage.getItem("token")}`
          },

          body: JSON.stringify({

            fullName:
              document.getElementById("fullName").value,

            phone:
              document.getElementById("phone").value,

            county:
              document.getElementById("county").value,

            subcounty:
              document.getElementById("subcounty").value,

            ward:
              document.getElementById("ward").value,

            business_name:
              document.getElementById("business_name").value,

            farm_type:
              document.getElementById("farm_type").value,

            crops:
              document.getElementById("crops").value,

            livestock:
              document.getElementById("livestock").value,

            specialization:
              document.getElementById("specialization").value,

            bio:
              document.getElementById("bio").value

          })
        }
      );

    const result =
      await response.json();

    message.textContent =
      result.message;

  } catch(error) {

    console.error(error);

    message.textContent =
      "Failed to update profile";

  }
}