const token = localStorage.getItem("token");

let allPosts = [];

loadPosts();

async function loadPosts() {

    const response = await fetch(

        `${window.API_BASE_URL}/community/my-posts`,

        {

            headers:{

                Authorization:`Bearer ${token}`

            }

        }

    );

    allPosts = await response.json();

    renderPosts(allPosts);

}

function renderPosts(posts){

    const container =

        document.getElementById(

            "myPostsContainer"

        );

    container.innerHTML = "";

    posts.forEach(post=>{

        const image =

            post.media.length

            ? `http://localhost:5000${post.media[0].media_url}`

            : "../images/default-post.jpg";

        container.innerHTML += `

        <div class="dashboard-card">

            <img

                src="${image}"

                class="community-preview-image"

            >

            <h3>

                ${post.title}

            </h3>

            <p>

                ${post.content.substring(0,120)}...

            </p>

            <p>

                👁 ${post.views}

                💬 ${post.commentCount}

                👍 ${post.reactionCount}

            </p>

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

}

document
.getElementById("searchPost")
.addEventListener(
    "input",
    searchPosts
);

function searchPosts(){

    const keyword =

        document
        .getElementById(
            "searchPost"
        )
        .value
        .toLowerCase();

    const filtered =

        allPosts.filter(post=>

            post.title
            .toLowerCase()
            .includes(keyword)

            ||

            post.content
            .toLowerCase()
            .includes(keyword)

        );

    renderPosts(filtered);

}

document
.getElementById("sortPosts")
.addEventListener(
    "change",
    sortPosts
);

function sortPosts(){

    const sort =

        document
        .getElementById(
            "sortPosts"
        ).value;

    const posts = [...allPosts];

    switch(sort){

        case "views":

            posts.sort(
                (a,b)=>

                b.views-a.views
            );

            break;

        case "comments":

            posts.sort(
                (a,b)=>

                b.commentCount-a.commentCount
            );

            break;

        case "oldest":

            posts.sort(
                (a,b)=>

                new Date(a.createdAt)-new Date(b.createdAt)
            );

            break;

        default:

            posts.sort(
                (a,b)=>

                new Date(b.createdAt)-new Date(a.createdAt)
            );

    }

    renderPosts(posts);

    
}

function viewCommunityPost(postId) {

    window.location.href =
        `../pages/communityPost.html?id=${postId}`;

}


async function deleteCommunityPost(id){

    const confirmed = confirm(
        "Delete this post?"
    );

    if(!confirmed) return;

    try{

        const response = await fetch(

            `${window.API_BASE_URL}/community/${id}`,

            {

                method:"DELETE",

                headers:{

                    Authorization:
                        `Bearer ${token}`

                }

            }

        );

        const result =
            await response.json();

        alert(result.message);

        loadPosts();

    }catch(error){

        console.error(error);

    }

}

function editCommunityPost(id) {

    window.location.href =
        `../pages/editCommunityPost.html?id=${id}`;

}

