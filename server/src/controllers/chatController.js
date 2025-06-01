import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Document from "../models/Document.js";
import DocumentEmbedding from "../models/DocumentEmbedding.js";
import RetrievalLog from "../models/RetrievalLog.js";
import ollamaService from "../services/ollamaService.js";

// Start a new conversation
export const startConversation = async (req, res, next) => {
  try {
    const { userId, title } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required to create a conversation",
      });
    }

    const conversation = await Conversation.create({
      userId,
      title: title || "New Conversation",
    });

    res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    next(error);
  }
};

// Generate a title from the first message
const generateTitle = async (content) => {
  try {
    const prompt = `Generate a short, descriptive title (max 5 words) for a conversation that starts with this message: "${content}"`;
    const { content: title } = await ollamaService.generateResponse(prompt);
    return title.trim();
  } catch (error) {
    console.error("Error generating title:", error);
    return "New Conversation";
  }
};

// Send a message and get bot response
export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, content } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({
        success: false,
        error: "Conversation ID and content are required",
      });
    }

    // Verify conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: "Conversation not found",
      });
    }

    // Save user message
    const userMessage = await Message.create({
      conversationId,
      sender: "user",
      content,
    });

    // If this is the first message, generate a title
    const messageCount = await Message.countDocuments({ conversationId });
    if (messageCount === 1) {
      const title = await generateTitle(content);
      await Conversation.findByIdAndUpdate(conversationId, {
        title,
        updatedAt: new Date(),
      });
      conversation.title = title;
    }

    try {
      // Get relevant documents (temporarily disabled vector search)
      const relevantDocs = await Document.find({}).limit(3);

      // Log retrieval
      await RetrievalLog.create({
        conversationId,
        userQuery: content,
        returnedDocs: relevantDocs.map((doc) => doc._id),
      });

      // Prepare context from relevant documents
      const context = relevantDocs.map((doc) => doc.content).join("\n\n");

      // Get bot response
      const { content: botResponse, tokensUsed } =
        await ollamaService.generateResponse(content, context);

      // Save bot message
      const botMessage = await Message.create({
        conversationId,
        sender: "bot",
        content: botResponse,
        tokensUsed,
      });

      // Update conversation timestamp
      await Conversation.findByIdAndUpdate(conversationId, {
        updatedAt: new Date(),
      });

      res.status(200).json({
        success: true,
        data: {
          userMessage,
          botMessage,
          conversation,
          relevantDocs: relevantDocs.map((doc) => ({
            title: doc.title,
            source: doc.source,
          })),
        },
      });
    } catch (error) {
      console.error("Error processing message:", error);
      // Save error message
      const errorMessage = await Message.create({
        conversationId,
        sender: "bot",
        content:
          "I apologize, but I encountered an error processing your message. Please try again.",
      });

      res.status(200).json({
        success: true,
        data: {
          userMessage,
          botMessage: errorMessage,
          conversation,
          error: "Error processing message",
        },
      });
    }
  } catch (error) {
    console.error("Error in sendMessage:", error);
    next(error);
  }
};

// Get conversation history
export const getConversationHistory = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        error: "Conversation ID is required",
      });
    }

    const messages = await Message.find({ conversationId }).sort({
      createdAt: 1,
    });

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Error getting conversation history:", error);
    next(error);
  }
};

// Get user's conversations
export const getUserConversations = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    const conversations = await Conversation.find({ userId }).sort({
      updatedAt: -1,
    });

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error("Error getting user conversations:", error);
    next(error);
  }
};
