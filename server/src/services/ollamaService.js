import axios from "axios";
import Document from "../models/Document.js";

class OllamaService {
  constructor() {
    this.baseURL = process.env.OLLAMA_API_URL || "http://localhost:11434";
    this.model = process.env.OLLAMA_MODEL || "llama2";
    this.baseSystemMessage = `You are an expert in fire safety, prevention, and management. Your knowledge includes:
- Fire behavior and dynamics
- Fire prevention techniques
- Fire safety regulations and standards
- Emergency response procedures
- Fire detection and suppression systems
- Risk assessment and management
- Fire investigation and analysis
- Fire safety training and education

You provide accurate, practical, and safety-focused advice while maintaining a professional and helpful tone. Always prioritize safety and recommend consulting with local fire authorities for specific situations.`;
  }

  async getSystemMessage() {
    try {
      // Get all documents from the database
      const documents = await Document.find().select("title content source");

      if (documents.length === 0) {
        return this.baseSystemMessage;
      }

      // Format documents for the system message
      const documentsContext = documents
        .map((doc) => {
          return `Document: ${doc.title}
Source: ${doc.source}
Content: ${doc.content}
---`;
        })
        .join("\n\n");

      return `${this.baseSystemMessage}

Additional Context from Training Documents:
${documentsContext}

Use the above documents as additional context when answering questions. If the documents contain relevant information, incorporate it into your response. If the documents don't contain relevant information, rely on your base knowledge.`;
    } catch (error) {
      console.error("Error fetching documents for system message:", error);
      return this.baseSystemMessage;
    }
  }

  async generateResponse(prompt, context = "") {
    try {
      // Get the system message with document content
      const systemMessage = await this.getSystemMessage();

      const fullPrompt = context
        ? `${systemMessage}\n\nContext: ${context}\n\nUser: ${prompt}`
        : `${systemMessage}\n\nUser: ${prompt}`;

      const response = await axios.post(`${this.baseURL}/api/generate`, {
        model: this.model,
        prompt: fullPrompt,
        stream: false,
      });

      return {
        content: response.data.response,
        tokensUsed: response.data.eval_count || 0,
      };
    } catch (error) {
      console.error("Error generating response from Ollama:", error);
      throw new Error("Failed to generate response from Ollama");
    }
  }

  async generateEmbedding(text) {
    try {
      const response = await axios.post(`${this.baseURL}/api/embeddings`, {
        model: this.model,
        prompt: text,
      });

      return response.data.embedding;
    } catch (error) {
      console.error("Error generating embedding from Ollama:", error);
      throw new Error("Failed to generate embedding from Ollama");
    }
  }
}

export default new OllamaService();
