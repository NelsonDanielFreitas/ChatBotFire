import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Document from "../models/Document.js";
import DocumentEmbedding from "../models/DocumentEmbedding.js";
import RetrievalLog from "../models/RetrievalLog.js";
import ollamaService from "../services/ollamaService.js";
import { encrypt, decrypt } from "../utils/crypto.js";

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

    // Decrypt the incoming message
    const decryptedContent = decrypt(content);

    // Save encrypted user message
    const userMessage = await Message.create({
      conversationId,
      sender: "user",
      content, // Store encrypted content
    });

    // If this is the first message, generate a title
    const messageCount = await Message.countDocuments({ conversationId });
    if (messageCount === 1) {
      const title = await generateTitle(decryptedContent);
      await Conversation.findByIdAndUpdate(conversationId, {
        title,
        updatedAt: new Date(),
      });
      conversation.title = title;
    }

    try {
      // RAG: Embed the user query
      let queryEmbedding;
      let allEmbeddings = [];
      let topChunks = [];
      let context = "";

      try {
        queryEmbedding = await ollamaService.generateEmbedding(
          decryptedContent
        );

        // Retrieve all document embeddings with their metadata
        allEmbeddings = await DocumentEmbedding.find({}).populate("docId");

        if (allEmbeddings.length > 0) {
          // Compute cosine similarity between query and each chunk
          function cosineSim(a, b) {
            if (!a || !b || a.length !== b.length) return 0;
            let dot = 0,
              normA = 0,
              normB = 0;
            for (let i = 0; i < a.length; i++) {
              dot += a[i] * b[i];
              normA += a[i] * a[i];
              normB += b[i] * b[i];
            }
            const denominator = Math.sqrt(normA) * Math.sqrt(normB);
            return denominator === 0 ? 0 : dot / denominator;
          }

          const scoredChunks = allEmbeddings
            .filter((emb) => emb.embedding && emb.embedding.length > 0)
            .map((emb) => ({
              docId: emb.docId,
              embedding: emb.embedding,
              chunkText: emb.chunkText,
              chunkIndex: emb.chunkIndex,
              score: cosineSim(queryEmbedding, emb.embedding),
            }))
            .filter((chunk) => chunk.score > 0.1); // Filter out very low similarity chunks

          scoredChunks.sort((a, b) => b.score - a.score);
          topChunks = scoredChunks.slice(0, 5); // Top 5 relevant chunks

          // Prepare context from the top chunks
          context = topChunks
            .map((chunk) => {
              const doc = chunk.docId;
              if (!doc) return "";
              return `From document: ${doc.title}\nSource: ${
                doc.source
              }\nCategory: ${doc.category}\nTags: ${doc.tags.join(
                ", "
              )}\nRelevance Score: ${chunk.score.toFixed(
                3
              )}\nRelevant Content:\n${chunk.chunkText}`;
            })
            .join("\n\n");
        }
      } catch (embeddingError) {
        console.error(
          "RAG embedding failed, falling back to traditional search:",
          embeddingError
        );

        // Fallback: Use traditional text search
        const allDocuments = await Document.find({
          $or: [
            { title: { $regex: decryptedContent, $options: "i" } },
            { content: { $regex: decryptedContent, $options: "i" } },
            { tags: { $in: [new RegExp(decryptedContent, "i")] } },
          ],
        }).limit(3);

        context = allDocuments
          .map((doc) => {
            return `From document: ${doc.title}\nSource: ${
              doc.source
            }\nCategory: ${doc.category}\nTags: ${doc.tags.join(
              ", "
            )}\nContent: ${doc.content.substring(0, 1000)}...`;
          })
          .join("\n\n");

        topChunks = allDocuments.map((doc) => ({ docId: doc, score: 0.5 }));
      }

      // Log retrieval
      await RetrievalLog.create({
        conversationId,
        userQuery: decryptedContent,
        returnedDocs: topChunks.map((c) => c.docId._id || c.docId),
      });

      // Get bot response using the context (either RAG or fallback)
      const { content: botResponse, tokensUsed } =
        await ollamaService.generateResponse(decryptedContent, context);

      // Encrypt bot response before saving
      const encryptedBotResponse = encrypt(botResponse);

      // Save encrypted bot message
      const botMessage = await Message.create({
        conversationId,
        sender: "bot",
        content: encryptedBotResponse,
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
          relevantDocs: topChunks
            .map((chunk) => {
              const doc = chunk.docId;
              return doc
                ? {
                    title: doc.title,
                    source: doc.source,
                    category: doc.category,
                    tags: doc.tags,
                    relevanceScore: chunk.score.toFixed(3),
                    chunkIndex: chunk.chunkIndex,
                  }
                : null;
            })
            .filter(Boolean),
        },
      });
    } catch (error) {
      console.error("Error processing message:", error);
      // Save error message (encrypted)
      const errorMessage = await Message.create({
        conversationId,
        sender: "bot",
        content: encrypt(
          "I apologize, but I encountered an error processing your message. Please try again."
        ),
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

    // Messages are already encrypted, frontend will handle decryption
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
