const params =
new URLSearchParams(
  window.location.search
);

const expertId =
params.get("id");

console.log(
  "EXPERT ID:",
  expertId
);

const bookingForm =
document.getElementById(
  "bookingForm"
);

const bookingMessage =
document.getElementById(
  "bookingMessage"
);

bookingForm.addEventListener(
  "submit",
  createBooking
);

async function createBooking(e) {

  e.preventDefault();

  try {

    const response =
      await fetch(
        "http://localhost:5000/api/bookings",
        {
          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${localStorage.getItem("token")}`
          },

          body: JSON.stringify({

            expert_id:
              expertId,

            topic:
              document.getElementById(
                "topic"
              ).value,

            description:
              document.getElementById(
                "description"
              ).value

          })
        }
      );

    const result =
      await response.json();

    console.log(result);

    bookingMessage.textContent =
      result.message;

    bookingForm.reset();

  } catch(error){

    console.error(error);

  }
}