import mongoose from "mongoose";

const documentEmbeddingSchema = new mongoose.Schema({
  docId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document",
    required: true,
  },
  embedding: { type: [Number], required: true }, // e.g., [0.123, -0.212, ...]
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("DocumentEmbedding", documentEmbeddingSchema);
