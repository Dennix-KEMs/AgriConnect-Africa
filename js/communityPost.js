const params =
    new URLSearchParams(
        window.location.search
    );

const postId =
    params.get("id");

loadPost();

async function loadPost(){

    try{

        const response =
            await fetch(

                `${window.API_BASE_URL}/community/${postId}`

            );

        const post =
            await response.json();

        renderPost(post);

loadFarmerProfile(post.farmer_id);

loadReactions();

    }catch(error){

        console.error(error);

    }

}
loadRelatedPosts(postId);

async function loadFarmerProfile(farmerId){

    try{

        const response = await fetch(
            `${window.API_BASE_URL}/community/farmer/${farmerId}/profile`
        );

        const farmer = await response.json();

        if(!response.ok){

            alert(farmer.error || "Failed to load farmer profile.");

            return;

        }

        renderFarmerProfile(farmer);

    }catch(error){

        console.error(error);

    }

}


function renderPost(post) {

    const container =
        document.getElementById(
            "postContainer"
        );

    const image =
    post.media?.length
        ? `http://localhost:5000${post.media[0].media_url}`
        : "../images/default-post.jpg";

    const date =

        new Date(post.createdAt)
        .toLocaleDateString();

    container.innerHTML = `

        <div class="dashboard-card">

            <img

                src="${image}"

                class="community-post-image"

            >

            <span class="community-category">

                ${post.category}

            </span>

            <h2>

                ${post.title}

            </h2>

            <div class="community-author">

                <strong>

                    👨‍🌾 ${post.fullName}

                </strong>

                <br>

                ${post.farm_type || "Farmer"}

                •

                ${post.county}

                <br>

                <small>

                    ${date}

                </small>

            </div>

            <div class="community-stats">

               <span>
    👁 ${post.views ?? 0}
</span>

<span>
    💬 ${post.commentCount ?? 0}
</span>

<span>
    👍 ${post.reactionCount ?? 0}
</span>

            </div>

            <hr>

            <div class="community-story">

                ${post.content}

            </div>

        </div>

              <section class="dashboard-card">

    <h3>
        Was this experience useful?
    </h3>

    <div id="reactionContainer">

    <button disabled>Loading...</button>

</div>

</section>

        <section id="commentsContainer"></section>

        <section id="farmerProfileContainer"></section>

        <section id="relatedPostsContainer"></section>

    `;

}

function renderFarmerProfile(farmer){

    const container =

document.getElementById(
"farmerProfileContainer"
);

    const image =

farmer.profile_image

? `http://localhost:5000${farmer.profile_image}`

: "../images/default-profile.png";

    container.innerHTML = `

<div class="dashboard-card farmer-learning-card">

<img

src="${image}"

class="farmer-avatar"

>

<h3>

${farmer.fullName}

</h3>

<p>

🌾 ${farmer.farm_type || "Farmer"}

</p>

<p>

📍 ${farmer.county}

</p>

<p>

🏆 Learning Score

<strong>

${farmer.learningScore}

</strong>

</p>

<hr>

<div class="learning-stats">

<div>

<h3>${farmer.posts}</h3>

<small>Posts</small>

</div>

<div>

<h3>${farmer.views}</h3>

<small>Views</small>

</div>

<div>

<h3>${farmer.comments}</h3>

<small>Comments</small>

</div>

<div>

<h3>${farmer.reactions}</h3>

<small>Helpful Reactions</small>

</div>

</div>

<button

onclick="viewFarmerProfile(${farmer.id})"
>

View Farmer Profile

</button> </div>

`; 

}

function viewFarmerProfile(id){

    window.location.href =
        `../dashboard/farmer.html?id=${id}`;

}

async function loadReactions(){

    try{

        const response =
            await fetch(

`${window.API_BASE_URL}/community/${postId}/reactions`

            );

        const reactions =
            await response.json();

        renderReactions(
            reactions
        );

    }catch(error){

        console.error(error);

    }

}

function renderReactions(reactions){

    const container =
        document.getElementById("reactionContainer");

    container.innerHTML = `

        <button
            class="reaction-btn"
            onclick="reactToPost('helpful')"
        >
            👍 Helpful (${reactions.helpful})
        </button>

        <button
            class="reaction-btn"
            onclick="reactToPost('thanks')"
        >
            🙏 Thanks (${reactions.thanks})
        </button>

        <button
            class="reaction-btn"
            onclick="reactToPost('great')"
        >
            ⭐ Great (${reactions.great})
        </button>

        <button
            class="reaction-btn"
            onclick="reactToPost('tried')"
        >
            🌱 Tried This (${reactions.tried})
        </button>

    `;

}

function capitalize(text){

    return text.charAt(0)
        .toUpperCase()

        + text.slice(1);

}

async function reactToPost(type){

    const token = localStorage.getItem("token");

    if(!token){

        alert("Please login first.");
        return;

    }

    const buttons =
        document.querySelectorAll(".reaction-btn");

    buttons.forEach(btn=>{
        btn.disabled = true;
    });

    try{

        const response = await fetch(

            `${window.API_BASE_URL}/community/${postId}/react`,

            {

                method:"POST",

                headers:{

                    Authorization:`Bearer ${token}`,
                    "Content-Type":"application/json"

                },

                body:JSON.stringify({

                    reaction:type

                })

            }

        );

        const result = await response.json();

        if(!response.ok){

            throw new Error(
                result.error || "Failed to react."
            );

        }

        renderReactions(
            result.reactions
        );

        showToast(
            "🌱 Thanks for supporting this farmer!"
        );

    }
    catch(error){

        alert(error.message);

    }
    finally{

        buttons.forEach(btn=>{
            btn.disabled = false;
        });

    }

}

function showToast(message){

    let toast =
        document.getElementById("toast");

    if(!toast){

        toast =
            document.createElement("div");

        toast.id = "toast";

        document.body.appendChild(toast);

    }

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(()=>{

        toast.classList.remove("show");

    },2500);

}

async function loadRelatedPosts(postId) {

    try {

        const response = await fetch(

            `${window.API_BASE_URL}/community/${postId}/related`

        );

        const posts = await response.json();

        renderRelatedPosts(posts);

    }

    catch(error){

        console.error(error);

    }

}

function renderRelatedPosts(posts) {

    const container =

        document.getElementById("relatedPosts");

    container.innerHTML = "";

    if(posts.length === 0){

        container.innerHTML =

            "<p>No related posts found.</p>";

        return;

    }

    posts.forEach(post=>{

        const image =

            post.media.length

            ? `http://localhost:5000${post.media[0].media_url}`

            : "../images/default-post.jpg";

        container.innerHTML += `

<div class="related-card">

<div class="recommendation-badge">

    ${post.recommendationReason}

</div>

<img

src="${image}"

class="related-image">

<h3>

${post.title}

</h3>

<p>

${post.content.substring(0,100)}...

</p>

<p>

👤 ${post.fullName}

</p>

<p>

📍 ${post.county}

</p>

<div>

👁 ${post.views}

&nbsp;

💬 ${post.commentCount}

&nbsp;

👍 ${post.reactionCount}

</div>

<br>

<button

onclick="location.href='communityPost.html?id=${post.id}'">

Read Story

</button>

</div>

`;

    });

}