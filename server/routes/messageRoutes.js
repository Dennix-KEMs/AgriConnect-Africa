const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const messageController =
require("../controllers/messageController");

const upload =
require("../middleware/messageUpload");

router.post(
  "/start",
  protect,
  messageController.startConversation
);

router.post(
    "/send",
    protect,
    upload.single("image"),
    messageController.sendMessage
);

router.get(
  "/",
  protect,
  messageController.getConversations
);

router.get(
  "/:conversationId",
  protect,
  messageController.getMessages
);

router.patch(
  "/:conversationId/read",
  protect,
  messageController.markAsRead
);

router.get(
  "/unread/count",
  protect,
  messageController.getUnreadCount
);

module.exports = router;