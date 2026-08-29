let currentPage = 1;

let totalPages = 1;

let loading = false;

loadCategories();
loadCounties();
loadFeaturedPosts();
loadCommunityPosts();
loadTrendingTopics();
loadTopFarmers();

document
.getElementById("loadMoreBtn")
.addEventListener("click", () => {

    if(currentPage >= totalPages) return;

    currentPage++;

    loadCommunityPosts(true);

});

document
.getElementById("categoryFilter")
.addEventListener(
    "change",
    () => {

        currentPage = 1;

        loadCommunityPosts();

    }
);

document
.getElementById("searchInput")
.addEventListener(
    "input",
    () => {

        currentPage = 1;

        loadCommunityPosts();

    }
);

document
.getElementById("countyFilter")
.addEventListener(
    "change",
    () => {

        currentPage = 1;

        loadCommunityPosts();

    }
);

document
.getElementById("sortFilter")
.addEventListener(
    "change",
    () => {

        currentPage = 1;

        loadCommunityPosts();

    }
);


async function loadCommunityPosts(append = false) {

    if(loading) return;

    loading = true;

    try{

    const search =

        document
        .getElementById("searchInput")
        .value;

    const category =

        document
        .getElementById("categoryFilter")
        .value;

    const county =

        document
        .getElementById("countyFilter")
        .value;

  const sort =
document.getElementById("sortFilter").value;
const params = new URLSearchParams();

params.append(
    "page",
    currentPage
);

if(search)
    params.append("search", search);

if(category)
    params.append("category", category);

if(county)
    params.append("county", county);

if(sort)
    params.append("sort", sort);

const response = await fetch(

`${window.API_BASE_URL}/community?${params}`

);
   

    const data = await response.json();

    if(!append && data.posts.length === 0){

    document.getElementById("communityFeed").innerHTML = `

        <p style="text-align:center">

            No community posts found.

        </p>

    `;

   const btn = document.getElementById("loadMoreBtn");

btn.style.display =
    currentPage < totalPages
        ? "inline-block"
        : "none";

btn.disabled = currentPage >= totalPages;

    return;

}

    renderPosts(data.posts, append);
    

totalPages = data.totalPages;

document.getElementById("pageInfo").textContent =

`Page ${currentPage} of ${totalPages}`;

document.getElementById(
    "loadMoreBtn"
).style.display =

currentPage < totalPages

? "inline-block"

: "none";

    }

    catch(error){

        console.error(error);

    }

    finally{

        loading = false;

    }

}


function renderPosts(posts, append = false) {

    const container =
        document.getElementById("communityFeed");

    if (!append)
        container.innerHTML = "";

    posts.forEach(post => {

        const image =

            post.media.length

            ? `http://localhost:5000${post.media[0].media_url}`

            : "../images/default-post.jpg";

        container.innerHTML += `

<div class="community-card">

<img
src="${image}"
class="community-image">

<h3>

${post.title}

</h3>

<p>

${post.content.substring(0,160)}...

</p>

<p>

👤 ${post.fullName}

</p>

<p>

📍 ${post.county}

</p>

<div>

👁 ${post.views}

💬 ${post.commentCount}

👍 ${post.reactionCount}

</div>

<br>

<button

onclick="location.href='communityPost.html?id=${post.id}'">

Read More

</button>

</div>

`;

    });

}

async function loadCategories() {

    try {

        const response = await fetch(
            `${window.API_BASE_URL}/community/categories`
        );

        const categories = await response.json();

        const select =
            document.getElementById("categoryFilter");

        select.innerHTML = `
            <option value="">
                All Categories
            </option>
        `;

        categories.forEach(category => {

            select.innerHTML += `
                <option value="${category.id}">
                    ${category.name}
                </option>
            `;

        });

    } catch (error) {

        console.error(error);

    }

}

async function loadCounties() {

    try {

        const response = await fetch(

            `${window.API_BASE_URL}/community/counties`

        );

        const counties =
            await response.json();

        const select =
            document.getElementById("countyFilter");

        select.innerHTML = `

            <option value="">
                All Counties
            </option>

        `;

        counties.forEach(county => {

            select.innerHTML += `

                <option value="${county.county}">

                    ${county.county}

                </option>

            `;

        });

    }

    catch(error){

        console.error(error);

    }

}

async function loadFeaturedPosts(){

    const response = await fetch(

        `${window.API_BASE_URL}/community/featured`

    );

    const posts = await response.json();

    renderFeaturedPosts(posts);

}

function renderFeaturedPosts(posts){

    const container =

        document.getElementById("featuredPosts");

    container.innerHTML="";

    posts.forEach(post=>{

        const image =

            post.media.length

            ? `http://localhost:5000${post.media[0].media_url}`

            : "../images/default-post.jpg";

        container.innerHTML += `

<div class="featured-post">

<img

src="${image}"

class="featured-image">

<h3>

${post.title}

</h3>

<p>

${post.content.substring(0,120)}...

</p>

<p>

👤 ${post.fullName}

</p>

<p>

👁 ${post.views}

💬 ${post.commentCount}

👍 ${post.reactionCount}

</p>

<button

onclick="location.href='communityPost.html?id=${post.id}'">

Read Story

</button>

</div>

`;

    });

}

async function loadTrendingTopics(){

    try{

        const response = await fetch(

            `${window.API_BASE_URL}/community/trending/topics`

        );

        const topics = await response.json();

        renderTrendingTopics(topics);

    }

    catch(error){

        console.error(error);

    }

}

function renderTrendingTopics(topics){

    const container =
        document.getElementById("trendingTopics");

    container.innerHTML = "";

    topics.forEach(topic=>{

        container.innerHTML += `

            <button
                class="topic-chip"
                onclick="filterByCategory(${topic.id})"
            >

                ${topic.name}

                (${topic.totalPosts})

            </button>

        `;

    });

}

function filterByCategory(categoryId){

    document.getElementById("categoryFilter").value = categoryId;

    currentPage = 1;

    loadCommunityPosts();

}

async function loadTopFarmers(){

    const response = await fetch(

        `${window.API_BASE_URL}/community/farmers`

    );

    const farmers = await response.json();

    renderTopFarmers(farmers);

}

function renderTopFarmers(farmers){

    const container =

        document.getElementById("topFarmers");

    container.innerHTML = "";

    farmers.forEach(farmer=>{

        const image = farmer.profile_image

            ? `http://localhost:5000${farmer.profile_image}`

            : "../images/default-profile.png";

        container.innerHTML += `

<div class="top-farmer-card">

<img

src="${image}"

class="farmer-avatar">

<h3>

${farmer.badge} ${farmer.fullName}

</h3>

<p>

🌾 ${farmer.farm_type || "Farmer"}

</p>

<p>

📍 ${farmer.county}

</p>

<p>

⭐ ${farmer.learningScore} pts

</p>

<p>

🏅 ${farmer.level}

</p>

<p>

📝 ${farmer.posts} Posts

</p>

<button

onclick="location.href='../dashboard/farmer.html?id=${farmer.id}'">

View Profile

</button>

</div>

`;

    });

}