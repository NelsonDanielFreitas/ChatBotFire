import mongoose from "mongoose";

const userEmbeddingCacheSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  inputText: { type: String, required: true },
  embedding: { type: [Number], required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("UserEmbeddingCache", userEmbeddingCacheSchema);
