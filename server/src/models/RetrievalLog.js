import mongoose from "mongoose";

const retrievalLogSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
  userQuery: String,
  returnedDocs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Document" }],
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("RetrievalLog", retrievalLogSchema);
