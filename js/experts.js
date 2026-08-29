const container =
document.getElementById(
  "expertsContainer"
);

loadExperts();

async function loadExperts() {

  try {

    const response =
      await fetch(
        "http://localhost:5000/api/experts"
      );

    const experts =
      await response.json();

    container.innerHTML = "";

    experts.forEach(expert => {

      container.innerHTML += `
        <div class="dashboard-card">

          <h3>
            ${expert.fullName}
          </h3>

          <p>
            ${expert.county}
          </p>

          <p>
            ${expert.email}
          </p>

          <p>

⭐⭐⭐⭐⭐

${expert.averageRating || "No ratings yet"}

</p>

<small>

${expert.totalReviews} Reviews

</small>

          <button
            onclick="bookExpert(${expert.id})"
          >
            Book Consultation
          </button>

        </div>
      `;
    });

  } catch(error){

    console.error(error);

  }
}

window.bookExpert =
function(expertId){

  window.location.href =
    `book-expert.html?id=${expertId}`;
};