import mongoose from "mongoose";

const documentEmbeddingSchema = new mongoose.Schema({
  docId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document",
    required: true,
  },
  embedding: { type: [Number], required: true }, // e.g., [0.123, -0.212, ...]
  chunkIndex: { type: Number, required: true }, // Which chunk this is
  chunkText: { type: String, required: true }, // The actual text of this chunk
  startChar: { type: Number, required: true }, // Starting character position
  endChar: { type: Number, required: true }, // Ending character position
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("DocumentEmbedding", documentEmbeddingSchema);
