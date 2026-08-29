let editingPostId = null;
console.log("communityDashboard loaded");

const communityContainer =
document.getElementById(
    "communityPostFormContainer"
);

document
.getElementById("openCommunityForm")
.addEventListener(
    "click",
    showCommunityForm
);

function showCommunityForm() {

    communityContainer.innerHTML = `

        <form id="communityForm">

            <select
                id="communityCategory"
                required
            >
                <option value="">
                    Select Category
                </option>
            </select>

            <input
                id="communityTitle"
                placeholder="Title"
                required
            >

            <textarea
                id="communityContent"
                placeholder="Share your experience..."
                required
            ></textarea>

            <input
                type="file"
                id="communityImages"
                multiple
                accept="image/*"
            >

            <input
                type="file"
                id="communityVideo"
                accept="video/*"
            >

            <select id="communityVisibility">

                <option value="public">
                    Public
                </option>

                <option value="followers">
                    Followers
                </option>

            </select>
<button
    type="submit"
    id="publishCommunityBtn"
>
    Publish
</button>

        </form>

    `;

    loadCommunityCategories();

    document
        .getElementById("communityForm")
        .addEventListener(
            "submit",
            uploadCommunityPost
       );
}

async function loadCommunityCategories() {

    try {

        const response = await fetch(
            `${window.API_BASE_URL}/community/categories`
        );

        const categories = await response.json();

        const select =
            document.getElementById(
                "communityCategory"
            );

        select.innerHTML = `
            <option value="">
                Select Category
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

async function uploadCommunityPost(e) {

    e.preventDefault();

    const formData = new FormData();

    formData.append(
        "category_id",
        document.getElementById("communityCategory").value
    );

    formData.append(
        "title",
        document.getElementById("communityTitle").value
    );

    formData.append(
        "content",
        document.getElementById("communityContent").value
    );

    formData.append(
        "visibility",
        document.getElementById("communityVisibility").value
    );

    const images =
        document.getElementById("communityImages").files;

    for (const image of images) {

        formData.append(
            "images",
            image
        );

    }

    const video =
        document.getElementById("communityVideo").files[0];

    if (video) {

        formData.append(
            "video",
            video
        );

    }

    try {

        const url = editingPostId
            ? `${window.API_BASE_URL}/community/${editingPostId}`
            : `${window.API_BASE_URL}/community/create`;

        const method = editingPostId
            ? "PUT"
            : "POST";

        const response = await fetch(

            url,

            {

                method,

                headers: {

                    Authorization:
                        `Bearer ${localStorage.getItem("token")}`

                },

                body: formData

            }

        );

        const result = await response.json();

        if (!response.ok) {

            alert(result.error);

            return;

        }

        alert(result.message);

        editingPostId = null;

        document.getElementById("communityForm").reset();

        document.getElementById(
            "publishCommunityBtn"
        ).textContent = "Publish";

        loadMyCommunityPosts();

        loadCommunitySummary();

        communityContainer.innerHTML = "";

    } catch (error) {

        console.error(error);

        alert("Failed to publish community post.");

    }

}

async function loadMyCommunityPosts() {

    try {

        const response = await fetch(

            `${window.API_BASE_URL}/community/my-posts`,

            {

                headers: {

                    Authorization:
                        `Bearer ${localStorage.getItem("token")}`

                }

            }

        );

        const posts = await response.json();

        renderMyCommunityPosts(posts);

    } catch (error) {

        console.error(error);

    }

}

loadMyCommunityPosts();

function renderMyCommunityPosts(posts) {

    const container =
        document.getElementById("myCommunityPosts");

    container.innerHTML = "";

    if (!posts.length) {

        container.innerHTML = `
            <p>
                You haven't shared any farming experience yet.
            </p>
        `;

        return;

    }

    const recentPosts = posts.slice(0,2);

    recentPosts.forEach(post=>{

        const image =

            post.media.length

                ? `http://localhost:5000${post.media[0].media_url}`

                : "../images/default-post.jpg";

        container.innerHTML += `

            <div class="dashboard-card">

                <img
                    src="${image}"
                    alt="${post.title}"
                    class="community-preview-image"
                >

                <h3>

                    ${post.title}

                </h3>

                <p>

                    ${post.content.substring(0,120)}...

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
                    onclick="viewCommunityPost(${post.id})"
                >

                    View

                </button>

                <button
                    onclick="editCommunityPost(${post.id})"
                >

                    Edit

                </button>

                <button
                    onclick="deleteCommunityPost(${post.id})"
                >

                    Delete

                </button>

            </div>

        `;

    });

    if(posts.length>2){

        container.innerHTML += `

            <div style="text-align:center;margin-top:20px;">

                <button

                    onclick="window.location.href='../pages/community-my-posts.html'"

                >

                    View All ${posts.length} Posts

                </button>

            </div>

        `;

    }

}

async function editCommunityPost(id) {

    const response = await fetch(
        `${window.API_BASE_URL}/community/${id}`
    );

    const post = await response.json();

    showCommunityForm();

    document.getElementById("communityCategory").value =
        post.category_id;

    document.getElementById("communityTitle").value =
        post.title;

    document.getElementById("communityContent").value =
        post.content;

    document.getElementById("communityVisibility").value =
        post.visibility;

    editingPostId = id;

    document.getElementById("publishCommunityBtn").textContent =
        "Update Post";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


async function deleteCommunityPost(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this post?"
    );

    if (!confirmed) return;

    try {

        const response = await fetch(

            `${window.API_BASE_URL}/community/${id}`,

            {

                method: "DELETE",

                headers: {

                    Authorization:
                        `Bearer ${localStorage.getItem("token")}`

                }

            }

        );

        const result = await response.json();

        alert(result.message);

        loadMyCommunityPosts();

        loadCommunitySummary();

    } catch (error) {

        console.error(error);

    }

}

async function loadCommunitySummary(){

    const response = await fetch(

        `${window.API_BASE_URL}/community/my-summary`,

        {

            headers:{

                Authorization:

                `Bearer ${localStorage.getItem("token")}`

            }

        }

    );

    const data = await response.json();

    document.getElementById(

        "communitySummary"

    ).innerHTML = `

        <p>📝 Posts: ${data.posts}</p>

        <p>👁 Views: ${data.views}</p>

        <p>💬 Comments: ${data.comments}</p>

        <p>👍 Reactions: ${data.reactions}</p>

        <h3>🏆 Score: ${data.score}</h3>

    `;

}
loadCommunitySummary();



