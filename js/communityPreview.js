const communityContainer =
    document.getElementById("communityPreview");

async function loadCommunityPreview() {

    try {

        const response = await fetch(
            `${window.API_BASE_URL}/community`
        );

        const data = await response.json();

        renderCommunityPreview(
            data.posts.slice(0, 3)
        );

    } catch (error) {

        console.error(error);

        communityContainer.innerHTML = `
            <div class="dashboard-card">
                Failed to load community posts.
            </div>
        `;

    }

}

loadCommunityPreview();

function renderCommunityPreview(posts) {

    const container =
        document.getElementById("communityPreview");

    container.innerHTML = "";

    if (!posts.length) {

        container.innerHTML = `
            <p>No community posts yet.</p>
        `;

        return;

    }

    posts.slice(0, 4).forEach(post => {

        const profileImage =

            post.profile_image

                ? `http://localhost:5000${post.profile_image}`

                : "../images/default-profile.png";

        const postImage =

            post.media.length

                ? `http://localhost:5000${post.media[0].media_url}`

                : "../images/default-post.jpg";

        container.innerHTML += `

<div class="community-feed-card">

    <div class="community-author">

        <img
            src="${profileImage}"
            class="community-avatar"
        >

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
        src="${postImage}"
        class="community-feed-image"
    >

    <h3>

        ${post.title}

    </h3>

    <p>

        ${post.content.substring(0,150)}...

    </p>

    <div class="community-feed-stats">

        <span>👁 ${post.views}</span>

        <span>💬 ${post.commentCount}</span>

        <span>👍 ${post.reactionCount}</span>

    </div>

    <button
        class="btn btn-green"
        onclick="location.href='communityPost.html?id=${post.id}'">

        Read More

    </button>

</div>

`;

    });

}