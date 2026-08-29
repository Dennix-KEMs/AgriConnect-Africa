const { pool } = require("../database/db");

exports.startConversation = async (req, res) => {
  try {

    const user1_id = req.user.id;
    const { user2_id } = req.body;

    if (!user2_id) {
      return res.status(400).json({
        error: "user2_id is required"
      });
    }

    const [existing] = await pool.query(
      `
      SELECT *
      FROM conversations
      WHERE
      (user1_id = ? AND user2_id = ?)
      OR
      (user1_id = ? AND user2_id = ?)
      `,
      [
        user1_id,
        user2_id,
        user2_id,
        user1_id
      ]
    );

    if (existing.length > 0) {
      return res.json({
  conversationId:
    existing[0].id
});
    }

    const [result] = await pool.query(
      `
      INSERT INTO conversations
      (
        user1_id,
        user2_id
      )
      VALUES (?, ?)
      `,
      [
        user1_id,
        user2_id
      ]
    );

    res.status(201).json({
      conversationId: result.insertId
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message
    });
  }
};

exports.sendMessage = async (req, res) => {

    try {

        const sender_id = req.user.id;

        const {
            conversation_id,
            message
        } = req.body;

        const image =
            req.file
                ? req.file.filename
                : null;

        if (
            !conversation_id ||
            (!message && !image)
        ) {
            return res.status(400).json({
                error:
                "Message or image is required."
            });
        }

        const [result] =
            await pool.query(
                `
                INSERT INTO messages
                (
                    conversation_id,
                    sender_id,
                    message,
                    image
                )
                VALUES
                (?, ?, ?, ?)
                `,
                [
                    conversation_id,
                    sender_id,
                    message || null,
                    image
                ]
            );

        const [conversation] =
            await pool.query(
                `
                SELECT *
                FROM conversations
                WHERE id = ?
                `,
                [conversation_id]
            );

        const chat =
            conversation[0];

        const receiverId =
            chat.user1_id === sender_id
                ? chat.user2_id
                : chat.user1_id;

        await pool.query(
            `
            INSERT INTO notifications
            (
                user_id,
                title,
                message
            )
            VALUES (?, ?, ?)
            `,
            [
                receiverId,
                "New Message",
                image
                    ? "You received an image."
                    : "You received a new message."
            ]
        );

        res.status(201).json({
            message: "Message sent",
            id: result.insertId
        });

    }

    catch(error){

        console.error(error);

        res.status(500).json({
            error:error.message
        });

    }

};

exports.getConversations = async (req, res) => {
  try {

    const userId = req.user.id;

    const [conversations] = await pool.query(
      `
      SELECT
  c.id,
  c.created_at,

  CASE
    WHEN c.user1_id = ?
    THEN u2.fullName
    ELSE u1.fullName
  END AS otherUser,

  CASE
    WHEN c.user1_id = ?
    THEN u2.accountType
    ELSE u1.accountType
  END AS accountType,

  (
    SELECT m.message
    FROM messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) AS lastMessage

FROM conversations c

JOIN users u1
  ON c.user1_id = u1.id

JOIN users u2
  ON c.user2_id = u2.id

WHERE
  c.user1_id = ?
  OR c.user2_id = ?

ORDER BY c.created_at DESC
      `,
      [
        userId,
        userId,
        userId,
        userId
      ]
    );

    res.json({
      totalConversations: conversations.length,
      conversations
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.getMessages = async (req, res) => {
  try {

    const { conversationId } = req.params;

    const [conversation] =
      await pool.query(
        `
        SELECT *
        FROM conversations
        WHERE id = ?
        `,
        [conversationId]
      );

    if (
      conversation.length === 0 ||
      (
        conversation[0].user1_id !== req.user.id &&
        conversation[0].user2_id !== req.user.id
      )
    ) {
      return res.status(403).json({
        error: "Access denied"
      });
    }

    const [messages] =
      await pool.query(
        `
        SELECT *
        FROM messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC
        `,
        [conversationId]
      );

      const otherUserId =
conversation[0].user1_id === req.user.id

?

conversation[0].user2_id

:

conversation[0].user1_id;

const [[otherUser]] =
await pool.query(

`
SELECT

fullName,

accountType,

profile_image,

last_seen,

CASE

WHEN

last_seen >=
DATE_SUB(NOW(), INTERVAL 2 MINUTE)

THEN TRUE

ELSE FALSE

END AS isOnline

FROM users

WHERE id = ?

`,

[otherUserId]

);

    res.json({

    totalMessages:messages.length,

    otherUser,

    messages

});
  } catch(error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }
};

exports.markAsRead = async (req, res) => {

    try {

        const { conversationId } = req.params;

        await pool.query(
            `
            UPDATE messages
            SET is_read = TRUE
            WHERE
                conversation_id = ?
            AND
                sender_id != ?
            `,
            [
                conversationId,
                req.user.id
            ]
        );

        res.json({
            message: "Messages marked as read"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};

exports.getUnreadCount = async (req, res) => {
  try {

    const [result] = await pool.query(
      `
     SELECT COUNT(*) AS unread
FROM messages m
JOIN conversations c
ON m.conversation_id = c.id
WHERE
m.is_read = FALSE
AND m.sender_id != ?
AND (
  c.user1_id = ?
  OR c.user2_id = ?
)
      `,
      [
  req.user.id,
  req.user.id,
  req.user.id
]
    );

    res.json(result[0]);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};