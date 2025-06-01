import express from "express";
import {
  startConversation,
  sendMessage,
  getConversationHistory,
  getUserConversations,
} from "../controllers/chatController.js";

const router = express.Router();

router.post("/conversations", startConversation);
router.post("/messages", sendMessage);
router.get("/conversations/:conversationId/messages", getConversationHistory);
router.get("/users/:userId/conversations", getUserConversations);

export default router;
