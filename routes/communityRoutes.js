const express = require("express");
const router = express.Router();

const {
   listCommunityPosts,
    getCommunityPost,
    createCommunityPost,
    createComment,
    listComments,
    reactToPost,
    getReactions,
    getTrendingTopics,
    getTopFarmers,
    getMostHelpfulPosts,
    removeReaction,
    getCommunityCategories,
    getMyCommunitySummary,
    deleteCommunityPost,
    updateCommunityPost,
    getFarmerLearningProfile,
    getFarmerPosts,
    getCommunityCounties,
    getMyCommunityPosts,
    getFeaturedPosts,
    getRelatedCommunityPosts
} = require("../controllers/communityController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");
const uploadCommunityMedia = require("../middleware/uploadCommunityMedia");

// ==================================================
// PUBLIC COMMUNITY FEED
// ==================================================

router.get("/", listCommunityPosts);

router.get("/trending/topics", getTrendingTopics);

router.get("/helpful", getMostHelpfulPosts);

// ==================================================
// COMMENTS
// ==================================================

router.get("/:id/comments", listComments);

router.post(
    "/:id/comment",
    protect,
    createComment
);

// ==================================================
// REACTIONS
// ==================================================

router.get("/:id/reactions", getReactions);

router.post(
    "/:id/react",
    protect,
    reactToPost
);

router.delete(
    "/:id/react",
    protect,
    removeReaction
);

// ==================================================
// COMMUNITY POSTS
// ==================================================

router.post(
    "/create",
    protect,
    authorize("Farmer", "Admin"),
    uploadCommunityMedia.fields([
        {
            name: "images",
            maxCount: 10
        },
        {
            name: "video",
            maxCount: 1
        }
    ]),
    createCommunityPost
);

router.get(
    "/farmers",
    getTopFarmers
);

router.get(
    "/categories",
    getCommunityCategories
);

router.get(
    "/my-posts",
    protect,
    getMyCommunityPosts
);

router.get(
    "/my-summary",
    protect,
    getMyCommunitySummary
);


router.delete(
    "/:id",
    protect,
    deleteCommunityPost
);

router.put(
    "/:id",
    protect,
    authorize("Farmer", "Admin"),
    uploadCommunityMedia.fields([
        {
            name: "images",
            maxCount: 10
        },
        {
            name: "video",
            maxCount: 1
        }
    ]),
    updateCommunityPost
);

router.get(
    "/farmer/:id/profile",
    getFarmerLearningProfile
);

router.get(
    "/farmer/:id/posts",
    getFarmerPosts
);

router.get(
    "/counties",
    getCommunityCounties
);

router.get(
    "/featured",
    getFeaturedPosts
);

router.get(
    "/:id/related",
    getRelatedCommunityPosts
);


router.get("/:id", getCommunityPost);

module.exports = router;