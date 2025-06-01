import axios from "axios";

class OllamaService {
  constructor() {
    this.baseURL = process.env.OLLAMA_API_URL || "http://localhost:11434";
    this.model = process.env.OLLAMA_MODEL || "llama2";
    this.systemMessage = `You are an expert in fire safety, prevention, and management. Your knowledge includes:
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

  async generateResponse(prompt, context = "") {
    try {
      const fullPrompt = context
        ? `${this.systemMessage}\n\nContext: ${context}\n\nUser: ${prompt}`
        : `${this.systemMessage}\n\nUser: ${prompt}`;

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
