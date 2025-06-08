import mongoose from "mongoose";

const pdfDocumentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  size: {
    type: Number,
    required: true,
  },
});

const PdfDocument = mongoose.model("PdfDocument", pdfDocumentSchema);

export default PdfDocument;
