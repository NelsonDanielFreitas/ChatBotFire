import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  source: { type: String, required: true }, // e.g., "NFPA", "Gov Site"
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: String,
  tags: [String],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Document", documentSchema);
