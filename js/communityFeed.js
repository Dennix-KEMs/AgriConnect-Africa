loadCommunityFeed();

async function loadCommunityFeed() {

    try {

        const response = await fetch(
            `${window.API_BASE_URL}/community`
        );

        const posts = await response.json();

        renderCommunityFeed(posts);

    } catch (error) {

        console.error(error);

    }

}

function renderCommunityFeed(posts) {

    const container =
        document.getElementById("communityFeed");

    container.innerHTML = "";

    if (!posts.length) {

        container.innerHTML =
            "<p>No community posts yet.</p>";

        return;

    }

    posts.slice(0,4).forEach(post => {

        const image =

            post.media.length

            ? `http://localhost:5000${post.media[0].media_url}`

            : "images/default-post.jpg";

        container.innerHTML += `

<div class="community-feed-card">

<div class="community-author">

<img
src="${
post.profile_image
? `http://localhost:5000${post.profile_image}`
: "images/default-profile.png"
}"
class="profile-avatar-small">

<div>

<h3>${post.fullName}</h3>

<p>

${post.farm_type || "Farmer"}

•

${post.county}

</p>

</div>

</div>

<img
src="${image}"
class="community-feed-image">

<h3>${post.title}</h3>

<p>

${post.content.substring(0,150)}...

</p>

<div class="community-stats">

👁 ${post.views}

💬 ${post.commentCount}

👍 ${post.reactionCount}

</div>

<button
onclick="location.href='pages/communityPost.html?id=${post.id}'">

Read More

</button>

</div>

`;

    });

}

loadCommunityFeed();

async function loadCommunityFeed() {

    try {

        const response = await fetch(

            `${window.API_BASE_URL}/community?limit=4`

        );

        const data = await response.json();

        renderCommunityFeed(data.posts);

    } catch (error) {

        console.error(error);

    }

}