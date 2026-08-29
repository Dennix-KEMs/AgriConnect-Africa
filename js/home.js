loadFeaturedExperts();

async function loadFeaturedExperts() {

    try {

        const response =
            await fetch(
                `${window.API_BASE_URL}/experts/featured`
            );

        const experts =
            await response.json();

        renderFeaturedExperts(
            experts
        );

    } catch (error) {

        console.error(error);

    }

}

function renderFeaturedExperts(experts) {

    const container =
        document.getElementById(
            "featuredExperts"
        );

    container.innerHTML = "";

    experts.forEach(expert => {

       container.innerHTML += `

<div class="expert-card">

    <img
        src="${
            expert.profile_image
            ?
            `${window.API_BASE_URL.replace("/api","")}/uploads/profiles/${expert.profile_image}`
            :
            "../images/default-profile.png"
        }"
        class="expert-avatar"
    >

    <h3>${expert.fullName}</h3>

    <p class="expert-specialization">
        ${
            expert.specialization ||
            "Agricultural Expert"
        }
    </p>

    <p class="expert-county">
        📍 ${expert.county}
    </p>

    <p class="expert-rating">

        ⭐ ${expert.averageRating}

        (${expert.totalReviews} Reviews)

    </p>

    <button
        class="btn btn-green"

        onclick="bookExpert(${expert.id})"

    >

        Book Consultation

    </button>

</div>

`;

    });

}
window.bookExpert = function(id){

    window.location.href =
        `book-expert.html?id=${id}`;

}