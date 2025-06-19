import axios from "axios";
import Document from "../models/Document.js";

class OllamaService {
  constructor() {
    this.baseURL = process.env.OLLAMA_API_URL || "http://localhost:11434";
    this.model = process.env.OLLAMA_MODEL || "llama2";
    this.baseSystemMessage = `You are an expert in fire safety, prevention, and management, with specific expertise in traditional ecological knowledge and prescribed burning. Your knowledge includes:
- Traditional fire management practices
- Ecological knowledge integration
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
      const documents = await Document.find().select(
        "title content source category tags"
      );

      if (documents.length === 0) {
        return this.baseSystemMessage;
      }

      // Format documents for the system message
      const documentsContext = documents
        .map((doc) => {
          // Split content into chunks to handle large documents
          const contentChunks = [];
          const chunkSize = 2000;
          for (let i = 0; i < doc.content.length; i += chunkSize) {
            contentChunks.push(doc.content.substring(i, i + chunkSize));
          }

          return `Document: ${doc.title}
Source: ${doc.source}
Category: ${doc.category}
Tags: ${doc.tags.join(", ")}
Content Parts:
${contentChunks
  .map((chunk, index) => `Part ${index + 1}:\n${chunk}`)
  .join("\n\n")}
---`;
        })
        .join("\n\n");

      return `${this.baseSystemMessage}

IMPORTANT INSTRUCTIONS:
1. You have access to detailed documents about traditional fire management and ecological knowledge.
2. When answering questions, ALWAYS check these documents first for relevant information.
3. If you find relevant information in the documents, use it as your primary source for the answer.
4. Quote or reference specific parts of the documents when providing information.
5. If the documents don't contain relevant information, clearly state this and then provide a general response based on your base knowledge.
6. Pay special attention to:
   - Traditional vs institutional burning practices
   - Ecological impacts and benefits
   - Historical context and cultural significance
   - Technical details and methodologies
   - Case studies and examples
7. Always maintain accuracy and cite your sources when possible.

Available Documents:
${documentsContext}

Remember: Your primary goal is to provide accurate information from the available documents. Only use your base knowledge when the documents don't contain relevant information. When discussing traditional fire management, always consider both the ecological and cultural aspects.`;
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
        ? `${systemMessage}\n\nContext: ${context}\n\nUser Question: ${prompt}\n\nPlease provide a detailed response based on the document content above. When discussing traditional fire management or ecological knowledge, make sure to:\n1. Reference specific examples from the documents\n2. Compare traditional and institutional approaches when relevant\n3. Include ecological and cultural perspectives\n4. Cite specific parts of the documents\n5. If the documents don't contain relevant information, clearly state this and provide a general response.`
        : `${systemMessage}\n\nUser Question: ${prompt}\n\nPlease provide a detailed response based on the document content above. When discussing traditional fire management or ecological knowledge, make sure to:\n1. Reference specific examples from the documents\n2. Compare traditional and institutional approaches when relevant\n3. Include ecological and cultural perspectives\n4. Cite specific parts of the documents\n5. If the documents don't contain relevant information, clearly state this and provide a general response.`;

      const response = await axios.post(`${this.baseURL}/api/generate`, {
        model: this.model,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          top_k: 40,
          num_ctx: 4096, // Increased context window
        },
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
