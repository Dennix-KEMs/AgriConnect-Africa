console.log("My Consultations Loaded");

loadBookings();

async function loadBookings() {

    try {

        const response = await fetch(
            "http://localhost:5000/api/bookings/farmer",
            {
                headers: {
                    Authorization:
                        `Bearer ${localStorage.getItem("token")}`
                }
            }
        );

        const data = await response.json();

        console.log(data);

        const container =
            document.getElementById(
                "bookingContainer"
            );

        container.innerHTML = "";

        if (
            !data.bookings ||
            data.bookings.length === 0
        ) {

            container.innerHTML = `
                <div class="dashboard-card">
                    <h3>No Consultations Yet</h3>
                    <p>
                        You have not booked any consultations.
                    </p>
                </div>
            `;

            return;

        }

        data.bookings.forEach(booking => {

            let statusColor = "#777";

            switch (booking.status) {

                case "pending":
                    statusColor = "#f39c12";
                    break;

                case "approved":
                    statusColor = "#27ae60";
                    break;

                case "completed":
                    statusColor = "#2980b9";
                    break;

                case "cancelled":
                    statusColor = "#c0392b";
                    break;

            }

            container.innerHTML += `

                <div class="dashboard-card">

                    <h3>${booking.topic}</h3>

                    <p>

                        <strong>Expert:</strong>

                        ${booking.expertName}

                    </p>

                    <p>

                        <strong>Specialization:</strong>

                        ${booking.specialization || "N/A"}

                    </p>

                    <p>

                        <strong>Booked:</strong>

                        ${new Date(
                            booking.booking_date
                        ).toLocaleString()}

                    </p>

                    <p>

                        <strong>Status:</strong>

                        <span style="
                            color:${statusColor};
                            font-weight:bold;
                        ">

                            ${booking.status}

                        </span>

                    </p>

                   <button onclick="viewNotes(${booking.id})">
    View Notes
</button>
<button
    onclick="messageExpert(${booking.expert_id})">
    💬 Message Expert
</button>

${
    booking.status === "completed"
    ?

    booking.reviewId

    ?

    `
    <span class="reviewed-badge">
        ✅ Reviewed
    </span>
    `

    :

    `
    <button
        onclick="openReviewModal(${booking.id})">
        ⭐ Rate Expert
    </button>
    `

    :

    ""
}


                </div>

            `;

        });

    } catch (error) {

        console.error(error);

    }

}

window.viewNotes = async function(id) {

    try {

        const response = await fetch(
            `http://localhost:5000/api/bookings/${id}`,
            {
                headers: {
                    Authorization:
                        `Bearer ${localStorage.getItem("token")}`
                }
            }
        );

        const booking = await response.json();

        document.getElementById(
            "expertName"
        ).textContent =
            booking.expertName;

        document.getElementById(
            "expertSpecialization"
        ).textContent =
            booking.specialization || "";

        document.getElementById(
            "notesContent"
        ).value =
            booking.consultation_notes ||
            "The expert has not added consultation notes yet.";

        document.getElementById(
            "notesModal"
        ).style.display =
            "block";

    } catch (error) {

        console.error(error);

    }

};
window.closeNotesModal = function() {

    document.getElementById(
        "notesModal"
    ).style.display = "none";

};

let selectedBooking = null;
let selectedExpert = null;

window.rateExpert = function(
    bookingId,
    expertId
){

    selectedBooking = bookingId;

    selectedExpert = expertId;

    document.getElementById(
        "expertReviewSection"
    ).style.display = "block";

}

async function submitExpertReview(){

    try{

        const response =
        await fetch(

            `${window.API_BASE_URL}/reviews/expert`,

            {

                method:"POST",

                headers:{

                    "Content-Type":"application/json",

                    Authorization:
                    `Bearer ${localStorage.getItem("token")}`

                },

                body:JSON.stringify({

                    booking_id:selectedBooking,

                    rating:Number(

                        document.getElementById(
                            "expertRating"
                        ).value

                    ),

                    review:

                    document.getElementById(
                        "expertReview"
                    ).value

                })

            }

        );

        const result =
        await response.json();

        alert(result.message);

        document.getElementById(
            "expertReviewSection"
        ).style.display="none";

        loadBookings();

    }

    catch(error){

        console.error(error);

    }

}

let selectedRating = 5;
window.openReviewModal = function(id){

    document.getElementById(
        "reviewBookingId"
    ).value = id;

    document.getElementById(
        "reviewText"
    ).value = "";

    selectedRating = 5;

    updateStars();

    document.getElementById(
        "reviewModal"
    ).style.display = "block";

};

window.closeReviewModal = function(){

    document.getElementById(
        "reviewModal"
    ).style.display = "none";

};
window.setRating = function(rating){

    selectedRating = rating;

    updateStars();

};

function updateStars(){

    const stars =
        document.querySelectorAll(
            ".rating-stars span"
        );

    stars.forEach((star,index)=>{

        if(index < selectedRating){

            star.classList.add("selected");

        }

        else{

            star.classList.remove("selected");

        }

    });

}

window.submitExpertReview = async function(){

    const booking_id =
        document.getElementById(
            "reviewBookingId"
        ).value;

    const review =
        document.getElementById(
            "reviewText"
        ).value.trim();

    try{

        const response =
            await fetch(

                `${window.API_BASE_URL}/reviews/expert`,

                {

                    method:"POST",

                    headers:{

                        "Content-Type":"application/json",

                        Authorization:
                        `Bearer ${localStorage.getItem("token")}`

                    },

                    body:JSON.stringify({

                        booking_id,

                        rating:selectedRating,

                        review

                    })

                }

            );

        const result =
            await response.json();

        if(!response.ok){

            alert(result.error);

            return;

        }

        alert(result.message);

        closeReviewModal();

        loadBookings();

    }

    catch(error){

        console.error(error);

        alert(
            "Failed to submit review."
        );

    }

};

window.messageExpert = async function(expertId){

    try{

        const response =
            await fetch(

                `${window.API_BASE_URL}/messages/start`,

                {

                    method:"POST",

                    headers:{

                        "Content-Type":"application/json",

                        Authorization:
                        `Bearer ${localStorage.getItem("token")}`

                    },

                    body:JSON.stringify({

                        user2_id:expertId

                    })

                }

            );

        const result =
            await response.json();

        window.location.href =
            `chat.html?id=${result.conversationId}`;

    }

    catch(error){

        console.error(error);

        alert("Unable to start conversation.");

    }

}

window.messageFarmer = async function(farmerId){

    try{

        const response =
            await fetch(

                `${window.API_BASE_URL}/messages/start`,

                {

                    method:"POST",

                    headers:{

                        "Content-Type":"application/json",

                        Authorization:
                        `Bearer ${localStorage.getItem("token")}`

                    },

                    body:JSON.stringify({

                        user2_id:farmerId

                    })

                }

            );

        const result =
            await response.json();

        window.location.href =
            `chat.html?id=${result.conversationId}`;

    }

    catch(error){

        console.error(error);

    }

}