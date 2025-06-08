import pkg from "pdfjs-dist/legacy/build/pdf.js";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import PdfDocument from "../models/PdfDocument.js";
import Document from "../models/Document.js";
import DocumentEmbedding from "../models/DocumentEmbedding.js";
import { createError } from "../utils/error.js";
import { createWorker } from "tesseract.js";
import { createCanvas } from "canvas";

const { getDocument } = pkg;

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("Current directory:", __dirname);

// Point PDF.js to its worker script
const workerPath = resolve(
  __dirname,
  "../../node_modules/pdfjs-dist/legacy/build/pdf.worker.js"
);
console.log("Worker path:", workerPath);

// Initialize PDF.js worker
try {
  console.log("Attempting to initialize PDF.js worker...");
  pkg.GlobalWorkerOptions.workerSrc = workerPath;
  console.log("PDF.js worker initialized successfully");
} catch (error) {
  console.error("Failed to initialize PDF.js worker:", error);
  console.error("Error details:", {
    message: error.message,
    stack: error.stack,
    code: error.code,
  });
}

// Function to extract text from an image using Tesseract
async function extractTextFromImage(imageData) {
  console.log("Initializing Tesseract worker...");
  const worker = await createWorker();
  try {
    console.log("Loading language data...");
    await worker.loadLanguage("eng");
    await worker.initialize("eng");

    console.log("Recognizing text from image...");
    const {
      data: { text },
    } = await worker.recognize(imageData);
    console.log("Text extracted from image:", text.substring(0, 100));

    return text;
  } catch (error) {
    console.error("Error in OCR:", error);
    return "";
  } finally {
    await worker.terminate();
  }
}

// Function to render PDF page to canvas
async function renderPageToCanvas(page) {
  const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext("2d");

  await page.render({
    canvasContext: context,
    viewport: viewport,
  }).promise;

  return canvas;
}

export const uploadPdf = async (req, res, next) => {
  console.log("\n=== Starting PDF upload process ===");
  try {
    if (!req.file) {
      console.log("No file in request");
      return next(createError(400, "No PDF file uploaded"));
    }

    console.log("File details:", {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer
        ? `Buffer exists (${req.file.buffer.length} bytes)`
        : "No buffer",
    });

    // Validate MIME type just to be safe
    console.log("Validating MIME type...");
    if (req.file.mimetype !== "application/pdf") {
      console.log("Invalid file type:", req.file.mimetype);
      return next(createError(400, "Only PDF files are allowed"));
    }

    // Validate file size again
    console.log("Validating file size...");
    if (req.file.size > 20 * 1024 * 1024) {
      console.log("File too large:", req.file.size);
      return next(createError(400, "File size must be less than 20MB"));
    }

    // PDF parsing
    console.log("Starting PDF parsing...");
    if (!req.file.buffer) {
      console.error("No buffer found in file object");
      return next(createError(500, "File buffer is missing"));
    }

    const dataBuffer = req.file.buffer;
    console.log("Buffer size:", dataBuffer.length);

    try {
      console.log("Creating PDF loading task...");
      const uint8Array = new Uint8Array(dataBuffer);
      console.log("Converted to Uint8Array, length:", uint8Array.length);

      const loadingTask = getDocument({
        data: uint8Array,
        cMapUrl: "https://unpkg.com/pdfjs-dist@3.11.174/cmaps/",
        cMapPacked: true,
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("PDF loading timeout")), 30000);
      });

      console.log("Waiting for PDF to load...");
      const pdf = await Promise.race([loadingTask.promise, timeoutPromise]);
      console.log("PDF loaded successfully, pages:", pdf.numPages);

      // Extract text
      console.log("Starting text extraction...");
      let extractedText = "";
      let processedPages = 0;

      for (let i = 1; i <= pdf.numPages; i++) {
        console.log(`\nProcessing page ${i} of ${pdf.numPages}`);
        try {
          const page = await pdf.getPage(i);

          // Extract regular text
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item) => item.str)
            .join(" ")
            .trim();

          // If no text found, try OCR
          let finalPageText = pageText;
          if (!pageText) {
            console.log(`No text found on page ${i}, attempting OCR...`);
            const canvas = await renderPageToCanvas(page);
            const imageText = await extractTextFromImage(canvas.toBuffer());
            finalPageText = imageText;
          }

          if (finalPageText) {
            extractedText += `Page ${i}:\n${finalPageText}\n\n`;
            console.log(`Page ${i} text length:`, finalPageText.length);
            console.log(
              `Page ${i} first 50 chars:`,
              finalPageText.substring(0, 50)
            );
          } else {
            console.log(`Warning: No text extracted from page ${i}`);
          }

          processedPages++;
          console.log(`Successfully processed page ${i}`);
        } catch (pageError) {
          console.error(`Error processing page ${i}:`, pageError);
          throw pageError;
        }
      }

      console.log(
        `\nText extraction complete. Processed ${processedPages} pages.`
      );
      console.log("Extracted text length:", extractedText.length);
      console.log(
        "First 200 characters of extracted text:",
        extractedText.substring(0, 200)
      );

      if (!extractedText.trim()) {
        console.error("No text was extracted from the PDF");
        return next(createError(500, "Failed to extract text from PDF"));
      }

      // Save to Document model
      console.log("\nPreparing to save to Document model...");
      const documentData = {
        source: "PDF Upload",
        title: req.file.originalname,
        content: extractedText,
        category: "Training",
        tags: ["PDF", "Training", "Upload"],
      };

      console.log("Document data to save:", {
        ...documentData,
        content: `[Content length: ${documentData.content.length} characters]`,
      });

      const document = new Document(documentData);

      console.log("Saving document to database...");
      const savedDocument = await document.save();
      console.log("Document saved successfully with ID:", savedDocument._id);
      console.log(
        "Saved document content length:",
        savedDocument.content.length
      );

      // Verify the saved document
      const verifiedDocument = await Document.findById(savedDocument._id);
      console.log("Verified saved document:", {
        id: verifiedDocument._id,
        title: verifiedDocument.title,
        contentLength: verifiedDocument.content.length,
        category: verifiedDocument.category,
        tags: verifiedDocument.tags,
      });

      return res.status(201).json({
        success: true,
        message: "PDF uploaded and processed successfully",
        data: {
          id: savedDocument._id,
          title: savedDocument.title,
          source: savedDocument.source,
          category: savedDocument.category,
          tags: savedDocument.tags,
          contentLength: savedDocument.content.length,
          uploadDate: savedDocument.createdAt,
        },
      });
    } catch (pdfError) {
      console.error("PDF processing error:", pdfError);
      return next(
        createError(500, `Error processing PDF file: ${pdfError.message}`)
      );
    }
  } catch (error) {
    console.error("Upload error:", error);
    next(createError(500, `Server error: ${error.message}`));
  }
};

export const getAllPdfs = async (req, res, next) => {
  try {
    const pdfs = await PdfDocument.find().select("-content");
    res.status(200).json({
      success: true,
      count: pdfs.length,
      data: pdfs,
    });
  } catch (error) {
    console.error("Get PDFs error:", error);
    next(error);
  }
};

export const getPdfById = async (req, res, next) => {
  try {
    const pdf = await PdfDocument.findById(req.params.id);
    if (!pdf) {
      return next(createError(404, "PDF document not found"));
    }
    res.status(200).json({
      success: true,
      data: pdf,
    });
  } catch (error) {
    console.error("Get PDF error:", error);
    next(error);
  }
};
