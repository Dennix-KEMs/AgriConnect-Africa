const { pool } = require("../database/db");
const {
    calculateLearningScore,
    getCommunityLevel,
} = require("../utils/communityScore");

exports.createCommunityPost = async (req, res) => {

    let connection;

    try {

        connection = await pool.getConnection();

        await connection.beginTransaction();

        const farmerId = req.user.id;

        const {
            category_id,
            title,
            content,
            visibility,
            status
        } = req.body;

        if (!category_id || !title || !content) {

            await connection.rollback();

            return res.status(400).json({
                error: "Category, title and content are required."
            });

        }

        // Get farmer location
        const [users] = await connection.query(
            `
            SELECT
                county,
                subcounty,
                ward
            FROM users
            WHERE id = ?
            `,
            [farmerId]
        );

        if (users.length === 0) {

            await connection.rollback();

            return res.status(404).json({
                error: "Farmer not found."
            });

        }

        const farmer = users[0];

        // Create community post
        const [postResult] = await connection.query(
            `
            INSERT INTO community_posts
            (
                farmer_id,
                category_id,
                title,
                content,
                county,
                visibility,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
                farmerId,
                category_id,
                title,
                content,
                farmer.county,
                visibility || "public",
                status || "published"
            ]
        );

        const postId = postResult.insertId;

        // Save uploaded images
        if (req.files && req.files.images) {

            let order = 1;

            for (const image of req.files.images) {

                await connection.query(
                    `
                    INSERT INTO community_media
                    (
                        post_id,
                        media_type,
                        media_url,
                        original_name,
                        display_order
                    )
                    VALUES (?, ?, ?, ?, ?)
                    `,
                    [
                        postId,
                        "image",
                        `/uploads/community/images/${image.filename}`,
                        image.originalname,
                        order++
                    ]
                );

            }

        }

        // Save uploaded video
        if (req.files && req.files.video) {

            const video = req.files.video[0];

            await connection.query(
                `
                INSERT INTO community_media
                (
                    post_id,
                    media_type,
                    media_url,
                    original_name,
                    display_order
                )
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    postId,
                    "video",
                    `/uploads/community/videos/${video.filename}`,
                    video.originalname,
                    1
                ]
            );

        }

        await connection.commit();

        res.status(201).json({

            message: "Community post created successfully.",

            postId

        });

    } catch (error) {

        if (connection) {

            await connection.rollback();

        }

        console.error(error);

        res.status(500).json({

            error: error.message

        });

    } finally {

        if (connection) {

            connection.release();

        }

    }

};

exports.listCommunityPosts = async (req, res) => {

    try {

     const {
    search,
    category,
    county,
    sort
} = req.query;

const page = Number(req.query.page) || 1;

const limit =
    Number(req.query.limit) || 10;
const offset = (page - 1) * limit;

let sql = `
SELECT

    cp.id,
    cp.title,
    cp.content,
    cp.county,
  cp.views,

(
    SELECT COUNT(*)
    FROM community_comments c
    WHERE
        c.post_id = cp.id
        AND c.is_deleted = FALSE
) AS commentCount,

(
    SELECT COUNT(*)
    FROM community_reactions r
    WHERE r.post_id = cp.id
) AS reactionCount,

cp.visibility,
    cp.createdAt,

    cc.name AS category,

    u.id AS farmer_id,
    u.fullName,
    u.profile_image,
    u.farm_type

FROM community_posts cp

JOIN users u
    ON cp.farmer_id = u.id

JOIN community_categories cc
    ON cp.category_id = cc.id

WHERE cp.status = 'published'
`;

let countSql = `
SELECT COUNT(*) AS total
FROM community_posts cp

JOIN users u
    ON cp.farmer_id = u.id

WHERE cp.status='published'
`;

const params = [];
const countParams = [];

if (search) {

    sql += `
        AND (
            cp.title LIKE ?
            OR cp.content LIKE ?
            OR u.fullName LIKE ?
        )
    `;

    countSql += `
        AND (
            cp.title LIKE ?
            OR cp.content LIKE ?
            OR u.fullName LIKE ?
        )
    `;

    params.push(
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
    );

    countParams.push(
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
    );

}

if (category) {

    sql += `
        AND cp.category_id = ?
    `;

    countSql += `
        AND cp.category_id = ?
    `;

    params.push(category);
    countParams.push(category);

}

if (county) {

    sql += `
        AND cp.county = ?
    `;

    countSql += `
        AND cp.county = ?
    `;

    params.push(county);
    countParams.push(county);

}

const [[count]] = await pool.query(
    countSql,
    countParams
);

switch (sort) {

    case "popular":

        sql += `
            ORDER BY cp.views DESC
        `;
        break;

    case "discussed":

        sql += `
            ORDER BY commentCount DESC
        `;
        break;

    case "helpful":

        sql += `
            ORDER BY reactionCount DESC
        `;
        break;

    case "oldest":

        sql += `
            ORDER BY cp.createdAt ASC
        `;
        break;

    default:

        sql += `
            ORDER BY cp.createdAt DESC
        `;
}

sql += `
LIMIT ?
OFFSET ?
`;

params.push(limit);
params.push(offset);

const [posts] = await pool.query(
    sql,
    params
);
       
        for (const post of posts) {

            const [media] = await pool.query(
                `
                SELECT
                    media_type,
                    media_url,
                    display_order
                FROM community_media
                WHERE post_id = ?
                ORDER BY display_order ASC
                `,
                [post.id]
            );

            post.media = media;
        }

        res.json({
            posts,
            currentPage: page,
            totalPosts: count.total,
            totalPages: Math.ceil(count.total / limit)
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};

exports.getCommunityPost = async (req, res) => {

    try {

        const { id } = req.params;

        // Increase view count
        await pool.query(
            `
            UPDATE community_posts
            SET views = views + 1
            WHERE id = ?
            `,
            [id]
        );

        // Fetch post
        const [posts] = await pool.query(
            `
            SELECT

                cp.*,

                cc.name AS category,

                u.id AS farmer_id,
                u.fullName,
                u.profile_image,
                u.farm_type,
                u.county,
                u.subcounty,
                u.ward

            FROM community_posts cp

            JOIN users u
                ON cp.farmer_id = u.id

            JOIN community_categories cc
                ON cp.category_id = cc.id

            WHERE cp.id = ?
            `,
            [id]
        );

        if (posts.length === 0) {

            return res.status(404).json({
                error: "Community post not found."
            });

        }

        const post = posts[0];

        // Fetch media
        const [media] = await pool.query(
            `
            SELECT
                media_type,
                media_url,
                display_order
            FROM community_media
            WHERE post_id = ?
            ORDER BY display_order ASC
            `,
            [id]
        );

        post.media = media;

        res.json(post);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};

exports.createComment = async (req, res) => {

    try {

        const postId = req.params.id;

        const userId = req.user.id;

        const {

            comment,

            parent_comment_id

        } = req.body;

        if (!comment || !comment.trim()) {

            return res.status(400).json({

                error: "Comment cannot be empty."

            });

        }

        // Ensure post exists
        const [posts] = await pool.query(
            `
            SELECT id
            FROM community_posts
            WHERE id = ?
            `,
            [postId]
        );

        if (posts.length === 0) {

            return res.status(404).json({

                error: "Community post not found."

            });

        }

        const [result] = await pool.query(
            `
            INSERT INTO community_comments
            (
                post_id,
                user_id,
                parent_comment_id,
                comment
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                postId,
                userId,
                parent_comment_id || null,
                comment
            ]
        );

        res.status(201).json({

            message: "Comment added successfully.",

            commentId: result.insertId

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            error: error.message

        });

    }

};

exports.listComments = async (req, res) => {

    try {

        const postId = req.params.id;

        const [comments] = await pool.query(
            `
            SELECT

                cc.id,
                cc.parent_comment_id,
                cc.comment,
                cc.createdAt,
                cc.updatedAt,

                u.id AS user_id,
                u.fullName,
                u.accountType,
                u.profile_image

            FROM community_comments cc

            JOIN users u

                ON cc.user_id = u.id

            WHERE

                cc.post_id = ?

                AND cc.is_deleted = FALSE

            ORDER BY cc.createdAt ASC
            `,
            [postId]
        );

        // Build lookup table
        const commentMap = {};

        comments.forEach(comment => {

            comment.replies = [];

            commentMap[comment.id] = comment;

        });

        const rootComments = [];

        comments.forEach(comment => {

            if (comment.parent_comment_id) {

                const parent = commentMap[comment.parent_comment_id];

                if (parent) {

                    parent.replies.push(comment);

                }

            } else {

                rootComments.push(comment);

            }

        });

        res.json(rootComments);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            error: error.message

        });

    }

};

exports.reactToPost = async (req, res) => {

    try {

        const postId = req.params.id;
        const userId = req.user.id;

        const { reaction } = req.body;

        const allowed = [
            "helpful",
            "thanks",
            "great",
            "tried"
        ];

        if (!allowed.includes(reaction)) {

            return res.status(400).json({
                error: "Invalid reaction."
            });

        }

        const [existing] = await pool.query(
            `
            SELECT id
            FROM community_reactions
            WHERE post_id = ?
            AND user_id = ?
            `,
            [postId, userId]
        );

        if (existing.length) {

    await pool.query(
        `
        UPDATE community_reactions
        SET reaction = ?
        WHERE id = ?
        `,
        [
            reaction,
            existing[0].id
        ]
    );

} else {

    await pool.query(
        `
        INSERT INTO community_reactions
        (
            post_id,
            user_id,
            reaction
        )
        VALUES (?, ?, ?)
        `,
        [
            postId,
            userId,
            reaction
        ]
    );

    const [reactions] = await pool.query(
`
SELECT
reaction,
COUNT(*) AS count
FROM community_reactions
WHERE post_id = ?
GROUP BY reaction
`,
[postId]
);

res.json({

    success: true,

    message: "Reaction saved.",

    reactions: counts,

    userReaction: reaction

});

return res.json({

    message:"Reaction updated."

});

}

        await pool.query(
            `
            INSERT INTO community_reactions
            (
                post_id,
                user_id,
                reaction
            )
            VALUES (?, ?, ?)
            `,
            [
                postId,
                userId,
                reaction
            ]
        );

        const [reactions] = await pool.query(
`
SELECT

reaction,

COUNT(*) AS count

FROM community_reactions

WHERE post_id=?

GROUP BY reaction
`,
[postId]
);

const counts = {

    helpful:0,
    thanks:0,
    great:0,
    tried:0,
    total:0

};

reactions.forEach(r=>{

    counts[r.reaction]=r.count;

    counts.total+=r.count;

});

res.json({

    success:true,

    message:"Reaction saved.",

    reactions:counts

});

return res.json({

    message:"Reaction updated."

});

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};

exports.getReactions = async (req, res) => {

    try {

        const postId = req.params.id;

        const [rows] = await pool.query(
            `
            SELECT reaction, COUNT(*) AS total
            FROM community_reactions
            WHERE post_id = ?
            GROUP BY reaction
            `,
            [postId]
        );

        const summary = {
            helpful: 0,
            thanks: 0,
            great: 0,
            tried: 0,
            total: 0
        };

        rows.forEach(row => {
            summary[row.reaction] = row.total;
            summary.total += row.total;
        });

        res.json(summary);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};

exports.removeReaction = async (req, res) => {

    try {

        await pool.query(
            `
            DELETE FROM community_reactions
            WHERE post_id = ?
            AND user_id = ?
            `,
            [
                req.params.id,
                req.user.id
            ]
        );

        res.json({
            message: "Reaction removed."
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};

exports.getTrendingTopics = async (req, res) => {

    try {

        const [topics] = await pool.query(
            `
            SELECT

                cc.id,
                cc.name,

                COUNT(cp.id) AS totalPosts

            FROM community_categories cc

            LEFT JOIN community_posts cp

                ON cp.category_id = cc.id

                AND cp.status='published'

            GROUP BY cc.id

            ORDER BY totalPosts DESC
            `
        );

        res.json(topics);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            error: error.message

        });

    }

};

exports.getMostHelpfulPosts = async (req, res) => {
    try {

        const [posts] = await pool.query(`
            SELECT
                cp.id,
                cp.title,
                cp.content,
                cp.createdAt,
                cp.views,

                cc.name AS category,

                u.id AS farmer_id,
                u.fullName,
                u.profile_image,
                u.farm_type,

                (
                    SELECT COUNT(*)
                    FROM community_reactions cr
                    WHERE cr.post_id = cp.id
                ) AS reactionCount,

                (
                    SELECT COUNT(*)
                    FROM community_comments cm
                    WHERE cm.post_id = cp.id
                ) AS commentCount

            FROM community_posts cp

            JOIN users u
                ON cp.farmer_id = u.id

            JOIN community_categories cc
                ON cp.category_id = cc.id

            WHERE cp.status = 'published'

            ORDER BY
                reactionCount DESC,
                commentCount DESC,
                cp.views DESC

            LIMIT 10
        `);

        for (const post of posts) {

            const [media] = await pool.query(
                `
                SELECT
                    media_type,
                    media_url,
                    display_order
                FROM community_media
                WHERE post_id = ?
                ORDER BY display_order ASC
                `,
                [post.id]
            );

            post.media = media;
        }

        res.json(posts);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }
};

exports.getTopFarmers = async (req, res) => {
    try {

        const [farmers] = await pool.query(`
            SELECT

                u.id,
                u.fullName,
                u.county,
                u.profile_image,
                u.farm_type,
                u.bio,

                COUNT(DISTINCT cp.id) AS posts,

                COALESCE(SUM(cp.views), 0) AS totalViews,

                (
                    SELECT COUNT(*)
                    FROM community_comments cc
                    JOIN community_posts p
                        ON cc.post_id = p.id
                    WHERE p.farmer_id = u.id
                ) AS comments,

                (
                    SELECT COUNT(*)
                    FROM community_reactions cr
                    JOIN community_posts p
                        ON cr.post_id = p.id
                    WHERE p.farmer_id = u.id
                ) AS reactions

            FROM users u

            LEFT JOIN community_posts cp
                ON cp.farmer_id = u.id
                AND cp.status = 'published'

            WHERE u.accountType = 'Farmer'

            GROUP BY
                u.id,
                u.fullName,
                u.county,
                u.profile_image,
                u.farm_type,
                u.bio
        `);

        // Calculate Learning Score
      farmers.forEach((farmer) => {

    farmer.learningScore =
calculateLearningScore({
    posts: farmer.posts,
    comments: farmer.comments,
    reactions: farmer.reactions,
    totalViews: farmer.totalViews,
});

    const levelInfo =
    getCommunityLevel(farmer.learningScore);

farmer.level = levelInfo.level;
farmer.badge = levelInfo.badge;

    const level =
        getCommunityLevel(
            farmer.learningScore
        );

    farmer.level = level.level;
    farmer.badge = level.badge;

});
        // Sort by Learning Score
       farmers.sort(

    (a, b) =>

        b.learningScore -

        a.learningScore

);

        // Return top 10
        res.json(farmers.slice(0, 10));

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }
};

exports.getFarmerProfile = async (req, res) => {
    try {
        const farmerId = req.params.id;

        const [[farmer]] = await pool.query(
            `
            SELECT
                id,
                fullName,
                county,
                subcounty,
                ward,
                farm_type,
                bio,
                profile_image
            FROM users
            WHERE id = ?
            AND accountType = 'Farmer'
            `,
            [farmerId]
        );

        if (!farmer) {
            return res.status(404).json({
                error: "Farmer not found."
            });
        }

        const [[stats]] = await pool.query(
            `
            SELECT
                COUNT(*) AS posts,
                COALESCE(SUM(views), 0) AS totalViews
            FROM community_posts
            WHERE farmer_id = ?
            AND status = 'published'
            `,
            [farmerId]
        );

        const [[reactions]] = await pool.query(
            `
            SELECT COUNT(*) AS total
            FROM community_reactions r
            JOIN community_posts p
                ON r.post_id = p.id
            WHERE p.farmer_id = ?
            `,
            [farmerId]
        );

        const [[comments]] = await pool.query(
            `
            SELECT COUNT(*) AS total
            FROM community_comments c
            JOIN community_posts p
                ON c.post_id = p.id
            WHERE p.farmer_id = ?
            `,
            [farmerId]
        );

        const [posts] = await pool.query(
            `
            SELECT
                id,
                title,
                content,
                createdAt,
                views
            FROM community_posts
            WHERE farmer_id = ?
            AND status = 'published'
            ORDER BY createdAt DESC
            `,
            [farmerId]
        );

        // Attach media to each post
        for (const post of posts) {
            const [media] = await pool.query(
                `
                SELECT
                    id,
                    media_type,
                    media_url,
                    display_order
                FROM community_media
                WHERE post_id = ?
                ORDER BY display_order
                `,
                [post.id]
            );

            post.media = media;
        }

        const [specializations] = await pool.query(
            `
            SELECT
                cc.name,
                COUNT(*) AS total
            FROM community_posts cp
            JOIN community_categories cc
                ON cp.category_id = cc.id
            WHERE cp.farmer_id = ?
            GROUP BY cc.id, cc.name
            ORDER BY total DESC
            `,
            [farmerId]
        );

        const learningScore = calculateLearningScore({
            posts: stats.posts,
            comments: comments.total,
            reactions: reactions.total,
            totalViews: stats.totalViews
        });

        const community = getCommunityLevel(
            learningScore
        );

        res.json({
            farmer,

            learningScore,

            level: community.level,

            badge: community.badge,

            statistics: {
                posts: stats.posts,
                comments: comments.total,
                reactions: reactions.total,
                totalViews: stats.totalViews
            },

            specializations,

            posts
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: error.message
        });
    }
};

exports.getCommunityCategories = async (req, res) => {

    try {

        const [categories] = await pool.query(`
            SELECT
                id,
                name
            FROM community_categories
            ORDER BY name ASC
        `);

        res.json(categories);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};

exports.getMyCommunityPosts = async (req, res) => {

    try {

        const [posts] = await pool.query(

            `
            SELECT

                cp.id,
                cp.title,
                cp.content,
                cp.createdAt,
                cp.views,

                cc.name AS category,

                (
                    SELECT COUNT(*)
                    FROM community_comments c
                    WHERE c.post_id = cp.id
                    AND c.is_deleted = FALSE
                ) AS commentCount,

                (
                    SELECT COUNT(*)
                    FROM community_reactions r
                    WHERE r.post_id = cp.id
                ) AS reactionCount

            FROM community_posts cp

            JOIN community_categories cc
                ON cp.category_id = cc.id

            WHERE
                cp.farmer_id = ?
                AND cp.status = 'published'

            ORDER BY cp.createdAt DESC
            `,
            [req.user.id]

        );

        for (const post of posts) {

            const [media] = await pool.query(

                `
                SELECT
                    media_type,
                    media_url
                FROM community_media
                WHERE post_id = ?
                ORDER BY display_order
                `,
                [post.id]

            );

            post.media = media;

        }

        res.json(posts);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            error: error.message

        });

    }

};

exports.getMyCommunitySummary = async (req, res) => {

    try {

        const [[summary]] = await pool.query(

            `
            SELECT

                COUNT(*) AS posts,

                COALESCE(SUM(views),0) AS views

            FROM community_posts

            WHERE farmer_id=?
            AND status='published'
            `,
            [req.user.id]

        );

        const [[comments]] = await pool.query(

            `
            SELECT COUNT(*) AS total

            FROM community_comments c

            JOIN community_posts p

            ON c.post_id=p.id

            WHERE p.farmer_id=?
            `,
            [req.user.id]

        );

        const [[reactions]] = await pool.query(

            `
            SELECT COUNT(*) AS total

            FROM community_reactions r

            JOIN community_posts p

            ON r.post_id=p.id

            WHERE p.farmer_id=?
            `,
            [req.user.id]

        );

        const score =
            summary.posts * 20 +
            summary.views +
            comments.total * 5 +
            reactions.total * 3;

        res.json({

            posts: summary.posts,

            views: summary.views,

            comments: comments.total,

            reactions: reactions.total,

            score

        });

    }

    catch(error){

        console.error(error);

        res.status(500).json({

            error:error.message

        });

    }

};

exports.deleteCommunityPost = async (req, res) => {

    try {

        const postId = req.params.id;

        const [[post]] = await pool.query(
            `
            SELECT *
            FROM community_posts
            WHERE id = ?
            `,
            [postId]
        );

        if (!post) {

            return res.status(404).json({
                error: "Post not found."
            });

        }

        // Only the owner or an admin can delete
        if (
            post.farmer_id !== req.user.id &&
            req.user.accountType !== "Admin"
        ) {

            return res.status(403).json({
                error: "Unauthorized."
            });

        }

        await pool.query(
            `
            DELETE FROM community_posts
            WHERE id = ?
            `,
            [postId]
        );

        res.json({

            message: "Community post deleted successfully."

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            error: error.message

        });

    }

};

exports.updateCommunityPost = async (req, res) => {

    try {

        const postId = req.params.id;

        const farmerId = req.user.id;

        const {

            category_id,

            title,

            content,

            visibility

        } = req.body;

        const [posts] = await pool.query(

            `

            SELECT id

            FROM community_posts

            WHERE id = ?

            AND farmer_id = ?

            `,

            [postId, farmerId]

        );

        if (!posts.length) {

            return res.status(404).json({

                error: "Post not found."

            });

        }

        await pool.query(

            `

            UPDATE community_posts

            SET

                category_id = ?,

                title = ?,

                content = ?,

                visibility = ?

            WHERE id = ?

            `,

            [

                category_id,

                title,

                content,

                visibility,

                postId

            ]

        );

        res.json({

            message: "Community post updated successfully."

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            error: error.message

        });

    }

};

exports.getFarmerLearningProfile = async (req,res)=>{

    try{

        const farmerId = req.params.id;

        const [[farmer]] = await pool.query(`

SELECT

u.id,

u.fullName,

u.profile_image,

u.county,

u.farm_type,

u.bio,

COUNT(DISTINCT cp.id) AS posts,

COALESCE(SUM(cp.views),0) AS views,

(
SELECT COUNT(*)

FROM community_comments cc

JOIN community_posts p

ON cc.post_id=p.id

WHERE p.farmer_id=u.id

) comments,

(
SELECT COUNT(*)

FROM community_reactions cr

JOIN community_posts p

ON cr.post_id=p.id

WHERE p.farmer_id=u.id

) reactions

FROM users u

LEFT JOIN community_posts cp

ON cp.farmer_id=u.id

AND cp.status='published'

WHERE u.id=?

GROUP BY u.id

        `,[farmerId]);

        farmer.learningScore =
    calculateLearningScore({
        posts: farmer.posts,
        comments: farmer.comments,
        reactions: farmer.reactions,
        totalViews: farmer.views,
    });

    const levelInfo =
    getCommunityLevel(farmer.learningScore);

farmer.level = levelInfo.level;
farmer.badge = levelInfo.badge;

        res.json(farmer);

    }catch(error){

        console.error(error);

        res.status(500).json({

            error:error.message

        });

    }

};

exports.getFarmerPosts = async (req, res) => {

    try {

        const farmerId = req.params.id;

        const [posts] = await pool.query(`

SELECT

cp.id,

cp.title,

cp.content,

cp.createdAt,
cp.views,

c.name AS category,

(

SELECT COUNT(*)

FROM community_comments cc

WHERE cc.post_id = cp.id

) AS commentCount,

(

SELECT COUNT(*)

FROM community_reactions cr

WHERE cr.post_id = cp.id

) AS reactionCount,

(

SELECT media_url

FROM community_media cm

WHERE cm.post_id = cp.id

LIMIT 1

) AS image

FROM community_posts cp

LEFT JOIN community_categories c

ON c.id = cp.category_id

WHERE cp.farmer_id = ?

AND cp.status = 'published'

ORDER BY cp.createdAt DESC

        `, [farmerId]);

        res.json(posts);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};

exports.updateCommunityPost = async (req, res) => {

    let connection;

    try {

        connection = await pool.getConnection();

        await connection.beginTransaction();

        const farmerId = req.user.id;

        const postId = req.params.id;

        const {
            category_id,
            title,
            content,
            visibility
        } = req.body;

        const [[post]] = await connection.query(
            `
            SELECT id
            FROM community_posts
            WHERE id = ?
            AND farmer_id = ?
            `,
            [postId, farmerId]
        );

        if (!post) {

            await connection.rollback();

            return res.status(404).json({
                error: "Community post not found."
            });

        }

        await connection.query(
            `
            UPDATE community_posts
            SET
                category_id = ?,
                title = ?,
                content = ?,
                visibility = ?
            WHERE id = ?
            `,
            [
                category_id,
                title,
                content,
                visibility,
                postId
            ]
        );

        // Replace media only if new files were uploaded
        if (
            (req.files && req.files.images && req.files.images.length) ||
            (req.files && req.files.video && req.files.video.length)
        ) {

            await connection.query(
                `
                DELETE FROM community_media
                WHERE post_id = ?
                `,
                [postId]
            );

            // Images
            if (req.files.images) {

                let order = 1;

                for (const image of req.files.images) {

                    await connection.query(
                        `
                        INSERT INTO community_media
                        (
                            post_id,
                            media_type,
                            media_url,
                            original_name,
                            display_order
                        )
                        VALUES (?, ?, ?, ?, ?)
                        `,
                        [
                            postId,
                            "image",
                            `/uploads/community/images/${image.filename}`,
                            image.originalname,
                            order++
                        ]
                    );

                }

            }

            // Video
            if (req.files.video) {

                const video = req.files.video[0];

                await connection.query(
                    `
                    INSERT INTO community_media
                    (
                        post_id,
                        media_type,
                        media_url,
                        original_name,
                        display_order
                    )
                    VALUES (?, ?, ?, ?, ?)
                    `,
                    [
                        postId,
                        "video",
                        `/uploads/community/videos/${video.filename}`,
                        video.originalname,
                        1
                    ]
                );

            }

        }

        await connection.commit();

        res.json({

            success: true,

            message: "Community post updated successfully."

        });

    } catch (error) {

        if (connection) {

            await connection.rollback();

        }

        console.error(error);

        res.status(500).json({

            error: error.message

        });

    } finally {

        if (connection) {

            connection.release();

        }

    }

};

exports.getCommunityCounties = async (req, res) => {

    try {

        const [counties] = await pool.query(`

            SELECT DISTINCT county

            FROM community_posts

            WHERE county IS NOT NULL
            AND county <> ''

            ORDER BY county ASC

        `);

        res.json(counties);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            error: error.message

        });

    }

};

exports.getFeaturedPosts = async (req, res) => {

    try {

        const [posts] = await pool.query(`

SELECT

cp.id,
cp.title,
cp.content,
cp.views,
cp.county,
cp.createdAt,

u.fullName,
u.profile_image,

(
SELECT COUNT(*)
FROM community_comments
WHERE post_id = cp.id
) AS commentCount,

(
SELECT COUNT(*)
FROM community_reactions
WHERE post_id = cp.id
) AS reactionCount

FROM community_posts cp

JOIN users u
ON cp.farmer_id = u.id

WHERE cp.status='published'

ORDER BY

reactionCount DESC,

commentCount DESC,

cp.views DESC

LIMIT 3

        `);

        for(const post of posts){

            const [media] = await pool.query(

                `

SELECT media_url

FROM community_media

WHERE post_id=?

ORDER BY display_order

LIMIT 1

                `,

                [post.id]

            );

            post.media = media;

        }

        res.json(posts);

    }

    catch(error){

        console.error(error);

        res.status(500).json({

            error:error.message

        });

    }

};

exports.getRelatedCommunityPosts = async (req, res) => {

    try {

        const { id } = req.params;

        // Get the current post
        const [[currentPost]] = await pool.query(
            `
            SELECT
                category_id,
                county
            FROM community_posts
            WHERE id = ?
            `,
            [id]
        );

        if (!currentPost) {

            return res.status(404).json({
                error: "Post not found."
            });

        }

        const [posts] = await pool.query(
            `
            SELECT

                cp.id,
                cp.title,
                cp.content,
                cp.county,
                cp.views,
                cp.createdAt,

                cc.name AS category,

                u.id AS farmer_id,
                u.fullName,
                u.profile_image,

                (
    (cp.category_id = ?) * 60
    +
    (cp.county = ?) * 25
    +
    (
        SELECT COUNT(*)
        FROM community_reactions r
        WHERE r.post_id = cp.id
    ) * 2
    +
    (
        SELECT COUNT(*)
        FROM community_comments c
        WHERE c.post_id = cp.id
    )
    +
    cp.views / 20
) AS score,

CASE

    WHEN cp.category_id = ? AND cp.county = ?
        THEN 'Same Category • Same County'

    WHEN cp.category_id = ?
        THEN 'Same Category'

    WHEN cp.county = ?
        THEN 'Same County'

    ELSE 'Popular Post'

END AS recommendationReason

            FROM community_posts cp

            JOIN users u
                ON cp.farmer_id = u.id

            JOIN community_categories cc
                ON cc.id = cp.category_id

            WHERE

                cp.status = 'published'

                AND cp.id <> ?

            ORDER BY score DESC

            LIMIT 4
            `,
           [
    currentPost.category_id,
    currentPost.county,

    currentPost.category_id,
    currentPost.county,

    currentPost.category_id,
    currentPost.county,

    id
]
        );

        for (const post of posts) {

            const [media] = await pool.query(
                `
                SELECT
                    media_type,
                    media_url
                FROM community_media
                WHERE post_id = ?
                ORDER BY display_order
                `,
                [post.id]
            );

            post.media = media;

        }

        res.json(posts);

    }

    catch(error){

        console.error(error);

        res.status(500).json({
            error:error.message
        });

    }

};