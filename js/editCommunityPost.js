const token = localStorage.getItem("token");

const params =
    new URLSearchParams(window.location.search);

const postId =
    params.get("id");

loadCategories();

loadPost();

async function loadCategories() {

    const response = await fetch(
        `${window.API_BASE_URL}/community/categories`
    );

    const categories =
        await response.json();

    const select =
        document.getElementById(
            "communityCategory"
        );

    select.innerHTML = "";

    categories.forEach(category => {

        select.innerHTML += `

            <option value="${category.id}">

                ${category.name}

            </option>

        `;

    });

}

async function loadPost() {

    const response = await fetch(

        `${window.API_BASE_URL}/community/${postId}`

    );

    const post =
        await response.json();

    document.getElementById(
        "communityCategory"
    ).value =
        post.category_id;

    document.getElementById(
        "communityTitle"
    ).value =
        post.title;

    document.getElementById(
        "communityContent"
    ).value =
        post.content;

    document.getElementById(
        "communityVisibility"
    ).value =
        post.visibility;

}
document
.getElementById("editPostForm")
.addEventListener(
    "submit",
    updatePost
);

async function updatePost(e){

    e.preventDefault();

    const formData =
        new FormData();

    formData.append(
        "category_id",
        document.getElementById(
            "communityCategory"
        ).value
    );

    formData.append(
        "title",
        document.getElementById(
            "communityTitle"
        ).value
    );

    formData.append(
        "content",
        document.getElementById(
            "communityContent"
        ).value
    );

    formData.append(
        "visibility",
        document.getElementById(
            "communityVisibility"
        ).value
    );

    const images =
        document.getElementById(
            "communityImages"
        ).files;

    for(const image of images){

        formData.append(
            "images",
            image
        );

    }

    const video =
        document.getElementById(
            "communityVideo"
        ).files[0];

    if(video){

        formData.append(
            "video",
            video
        );

    }

    const response =
        await fetch(

`${window.API_BASE_URL}/community/${postId}`,

        {

            method:"PUT",

            headers:{

                Authorization:
`Bearer ${token}`

            },

            body:formData

        }

    );

    const result =
        await response.json();

    alert(result.message);

    window.location.href =
        "community-my-posts.html";

}