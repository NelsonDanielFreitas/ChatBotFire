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

// Text cleaning and formatting functions
function cleanText(text) {
  return (
    text
      // Fix Portuguese characters more comprehensively
      .replace(/[ãâáà]/g, "a")
      .replace(/[ÃÂÁÀ]/g, "A")
      .replace(/[éêè]/g, "e")
      .replace(/[ÉÊÈ]/g, "E")
      .replace(/[íîì]/g, "i")
      .replace(/[ÍÎÌ]/g, "I")
      .replace(/[óôõò]/g, "o")
      .replace(/[ÓÔÕÒ]/g, "O")
      .replace(/[úûù]/g, "u")
      .replace(/[ÚÛÙ]/g, "U")
      .replace(/[ç]/g, "c")
      .replace(/[Ç]/g, "C")
      .replace(/[ñ]/g, "n")
      .replace(/[Ñ]/g, "N")

      // Fix common OCR issues more aggressively
      .replace(/[|l]/g, "I") // Fix vertical lines and lowercase L
      .replace(/[0]/g, "O") // Fix zero to O
      .replace(/[1]/g, "I") // Fix one to I
      .replace(/[5]/g, "S") // Fix five to S
      .replace(/[8]/g, "B") // Fix eight to B
      .replace(/[6]/g, "G") // Fix six to G
      .replace(/[9]/g, "g") // Fix nine to lowercase g

      // Fix common OCR character substitutions
      .replace(/[¢]/g, "c")
      .replace(/[£]/g, "E")
      .replace(/[¥]/g, "Y")
      .replace(/[§]/g, "S")
      .replace(/[©]/g, "C")
      .replace(/[®]/g, "R")
      .replace(/[™]/g, "TM")
      .replace(/[°]/g, "o")
      .replace(/[²]/g, "2")
      .replace(/[³]/g, "3")
      .replace(/[±]/g, "+")
      .replace(/[×]/g, "x")
      .replace(/[÷]/g, "/")
      .replace(/[≠]/g, "!=")
      .replace(/[≤]/g, "<=")
      .replace(/[≥]/g, ">=")
      .replace(/[∞]/g, "infinity")
      .replace(/[∑]/g, "sum")
      .replace(/[∏]/g, "product")
      .replace(/[√]/g, "sqrt")
      .replace(/[∫]/g, "integral")
      .replace(/[∆]/g, "delta")
      .replace(/[∇]/g, "nabla")
      .replace(/[∂]/g, "partial")
      .replace(/[∝]/g, "proportional")
      .replace(/[∅]/g, "empty")
      .replace(/[∈]/g, "in")
      .replace(/[∉]/g, "not in")
      .replace(/[⊂]/g, "subset")
      .replace(/[⊃]/g, "superset")
      .replace(/[∪]/g, "union")
      .replace(/[∩]/g, "intersection")
      .replace(/[∨]/g, "or")
      .replace(/[∧]/g, "and")
      .replace(/[¬]/g, "not")
      .replace(/[∀]/g, "for all")
      .replace(/[∃]/g, "exists")
      .replace(/[∄]/g, "not exists")
      .replace(/[∴]/g, "therefore")
      .replace(/[∵]/g, "because")
      .replace(/[∎]/g, "end proof")

      // Remove excessive whitespace and formatting artifacts
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, "\n") // Remove empty lines
      .replace(/\t/g, " ") // Replace tabs with spaces

      // Fix spacing around punctuation
      .replace(/([a-z])\s+([A-Z])/g, "$1 $2") // Fix space between lowercase and uppercase
      .replace(/([.,!?])\s*([A-Z])/g, "$1 $2") // Ensure space after punctuation
      .replace(/\s+([.,!?])/g, "$1") // Remove spaces before punctuation

      // Fix common word separations
      .replace(/([a-z])-([a-z])/g, "$1$2") // Fix hyphenated words
      .replace(/(\d)\s+(\d)/g, "$1$2") // Fix separated numbers

      // Remove isolated characters and artifacts
      .replace(/\b[a-zA-Z]\b/g, (match) => {
        // Keep single letters only if they're common (a, I, A)
        return ["a", "A", "I", "i"].includes(match) ? match : "";
      })

      // Remove excessive punctuation
      .replace(/[.,!?]{2,}/g, (match) => match[0])

      // Clean up page markers and artifacts
      .replace(/Page\s+\d+:\s*/g, "") // Remove "Page X:" markers
      .replace(/\[.*?\]/g, "") // Remove content in brackets
      .replace(/\{.*?\}/g, "") // Remove content in braces

      // Fix spacing around punctuation
      .replace(/([A-Za-z])\s*([.,!?])\s*([A-Za-z])/g, "$1$2 $3") // Fix spacing around punctuation
      .replace(/([A-Za-z])\s*([-–—])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around dashes
      .replace(/([A-Za-z])\s*([/])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around slashes
      .replace(/([A-Za-z])\s*([(])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around parentheses
      .replace(/([A-Za-z])\s*([)])\s*([A-Za-z])/g, "$1$2$3")
      .replace(/([A-Za-z])\s*([[])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around brackets
      .replace(/([A-Za-z])\s*([\]])\s*([A-Za-z])/g, "$1$2$3")
      .replace(/([A-Za-z])\s*([{])/g, "$1$2") // Fix spacing around braces
      .replace(/([}])\s*([A-Za-z])/g, "$1$2")
      .replace(/([A-Za-z])\s*([=])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around equals
      .replace(/([A-Za-z])\s*([+])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around plus
      .replace(/([A-Za-z])\s*([*])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around asterisk
      .replace(/([A-Za-z])\s*([&])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around ampersand
      .replace(/([A-Za-z])\s*([#])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around hash
      .replace(/([A-Za-z])\s*([@])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around at
      .replace(/([A-Za-z])\s*([%])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around percent
      .replace(/([A-Za-z])\s*([$])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around dollar
      .replace(/([A-Za-z])\s*([€])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around euro
      .replace(/([A-Za-z])\s*([£])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around pound
      .replace(/([A-Za-z])\s*([¥])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around yen
      .replace(/([A-Za-z])\s*([¢])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around cent
      .replace(/([A-Za-z])\s*([§])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around section
      .replace(/([A-Za-z])\s*([©])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around copyright
      .replace(/([A-Za-z])\s*([®])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around registered
      .replace(/([A-Za-z])\s*([™])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around trademark
      .replace(/([A-Za-z])\s*([°])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around degree
      .replace(/([A-Za-z])\s*([²])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around squared
      .replace(/([A-Za-z])\s*([³])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around cubed
      .replace(/([A-Za-z])\s*([±])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around plus-minus
      .replace(/([A-Za-z])\s*([×])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around multiplication
      .replace(/([A-Za-z])\s*([÷])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around division
      .replace(/([A-Za-z])\s*([≠])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around not equal
      .replace(/([A-Za-z])\s*([≤])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around less than or equal
      .replace(/([A-Za-z])\s*([≥])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around greater than or equal
      .replace(/([A-Za-z])\s*([∞])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around infinity
      .replace(/([A-Za-z])\s*([∑])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around sum
      .replace(/([A-Za-z])\s*([∏])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around product
      .replace(/([A-Za-z])\s*([√])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around square root
      .replace(/([A-Za-z])\s*([∫])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around integral
      .replace(/([A-Za-z])\s*([∆])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around delta
      .replace(/([A-Za-z])\s*([∇])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around nabla
      .replace(/([A-Za-z])\s*([∂])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around partial
      .replace(/([A-Za-z])\s*([∝])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around proportional
      .replace(/([A-Za-z])\s*([∅])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around empty set
      .replace(/([A-Za-z])\s*([∈])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around element of
      .replace(/([A-Za-z])\s*([∉])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around not element of
      .replace(/([A-Za-z])\s*([⊂])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around subset of
      .replace(/([A-Za-z])\s*([⊃])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around superset of
      .replace(/([A-Za-z])\s*([∪])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around union
      .replace(/([A-Za-z])\s*([∩])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around intersection
      .replace(/([A-Za-z])\s*([∨])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around logical or
      .replace(/([A-Za-z])\s*([∧])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around logical and
      .replace(/([A-Za-z])\s*([¬])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around logical not
      .replace(/([A-Za-z])\s*([∀])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around for all
      .replace(/([A-Za-z])\s*([∃])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around there exists
      .replace(/([A-Za-z])\s*([∄])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around there does not exist
      .replace(/([A-Za-z])\s*([∴])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around therefore
      .replace(/([A-Za-z])\s*([∵])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around because
      .replace(/([A-Za-z])\s*([∎])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around end of proof
      .replace(/([A-Za-z])\s*([∏])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around product
      .replace(/([A-Za-z])\s*([∑])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around sum
      .replace(/([A-Za-z])\s*([∐])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around coproduct
      .replace(/([A-Za-z])\s*([∅])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around empty set
      .replace(/([A-Za-z])\s*([∈])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around element of
      .replace(/([A-Za-z])\s*([∉])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around not element of
      .replace(/([A-Za-z])\s*([⊂])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around subset of
      .replace(/([A-Za-z])\s*([⊃])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around superset of
      .replace(/([A-Za-z])\s*([∪])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around union
      .replace(/([A-Za-z])\s*([∩])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around intersection
      .replace(/([A-Za-z])\s*([∨])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around logical or
      .replace(/([A-Za-z])\s*([∧])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around logical and
      .replace(/([A-Za-z])\s*([¬])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around logical not
      .replace(/([A-Za-z])\s*([∀])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around for all
      .replace(/([A-Za-z])\s*([∃])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around there exists
      .replace(/([A-Za-z])\s*([∄])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around there does not exist
      .replace(/([A-Za-z])\s*([∴])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around therefore
      .replace(/([A-Za-z])\s*([∵])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around because
      .replace(/([A-Za-z])\s*([∎])\s*([A-Za-z])/g, "$1$2$3") // Fix spacing around end of proof
      .trim()
  );
}

function formatPageText(textContent) {
  let formattedText = "";
  let currentLine = "";
  let lastY = null;
  let lastFontSize = null;

  // Sort items by vertical position (top to bottom) and then horizontal position (left to right)
  const sortedItems = textContent.items.sort((a, b) => {
    if (Math.abs(a.transform[5] - b.transform[5]) > 5) {
      // If vertical difference is significant
      return a.transform[5] - b.transform[5];
    }
    return a.transform[4] - b.transform[4];
  });

  for (const item of sortedItems) {
    const y = item.transform[5];
    const fontSize = Math.sqrt(
      item.transform[0] * item.transform[0] +
        item.transform[1] * item.transform[1]
    );

    // Check if we're on a new line
    if (lastY !== null && Math.abs(y - lastY) > 5) {
      formattedText += cleanText(currentLine) + "\n";
      currentLine = "";
    }

    // Add space between words if needed
    if (
      currentLine &&
      !currentLine.endsWith(" ") &&
      !item.str.startsWith(" ")
    ) {
      currentLine += " ";
    }

    currentLine += item.str;
    lastY = y;
    lastFontSize = fontSize;
  }

  // Add the last line
  if (currentLine) {
    formattedText += cleanText(currentLine);
  }

  return formattedText;
}

// Function to detect if page has significant text content
function hasSignificantText(textContent) {
  const text = textContent.items.map((item) => item.str).join(" ");
  const cleanText = text.replace(/\s+/g, " ").trim();
  return cleanText.length > 50; // Consider significant if more than 50 characters
}

// Function to extract text from an image using Tesseract
async function extractTextFromImage(imageData) {
  console.log("Initializing Tesseract worker...");
  const worker = await createWorker();
  try {
    console.log("Loading language data...");
    // Load both English and Portuguese for better recognition
    await worker.loadLanguage("eng+por");
    await worker.initialize("eng+por");

    // Configure OCR for better accuracy
    await worker.setParameters({
      tessedit_char_whitelist:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?;:()[]{}\"'-_/\\+=<>@#$%&*|~`^°²³±×÷≠≤≥∞∑∏√∫∆∇∂∝∅∈∉⊂⊃∪∩∨∧¬∀∃∄∴∵∎ãâáàÃÂÁÀéêèÉÊÈíîìÍÎÌóôõòÓÔÕÒúûùÚÛÙçÇñÑ",
      tessedit_pageseg_mode: "6", // Uniform block of text
      tessedit_ocr_engine_mode: "3", // Default, based on what is available
      preserve_interword_spaces: "1",
    });

    console.log("Recognizing text from image...");
    const {
      data: { text },
    } = await worker.recognize(imageData);
    console.log("Text extracted from image:", text.substring(0, 100));

    return cleanText(text);
  } catch (error) {
    console.error("Error in OCR:", error);
    return "";
  } finally {
    await worker.terminate();
  }
}

// Function to render PDF page to canvas
async function renderPageToCanvas(page) {
  const viewport = page.getViewport({ scale: 3.0 }); // Higher scale for better quality
  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext("2d");

  // Set white background
  context.fillStyle = "white";
  context.fillRect(0, 0, viewport.width, viewport.height);

  await page.render({
    canvasContext: context,
    viewport: viewport,
  }).promise;

  return canvas;
}

// Function to post-process and enhance extracted text
function enhanceExtractedText(text) {
  return (
    text
      // Remove page markers and artifacts
      .replace(/Page\s+\d+:\s*/g, "")
      .replace(/\[.*?\]/g, "")
      .replace(/\{.*?\}/g, "")

      // Fix common OCR artifacts
      .replace(/\b([a-zA-Z])\s+([a-zA-Z])\b/g, (match, char1, char2) => {
        // Fix separated letters that should be words
        const commonWords = [
          "the",
          "and",
          "for",
          "are",
          "but",
          "not",
          "you",
          "all",
          "can",
          "had",
          "her",
          "was",
          "one",
          "our",
          "out",
          "day",
          "get",
          "has",
          "him",
          "his",
          "how",
          "man",
          "new",
          "now",
          "old",
          "see",
          "two",
          "way",
          "who",
          "boy",
          "did",
          "its",
          "let",
          "put",
          "say",
          "she",
          "too",
          "use",
        ];
        const combined = char1.toLowerCase() + char2.toLowerCase();
        return commonWords.includes(combined) ? combined : match;
      })

      // Fix common word separations
      .replace(/(\w+)\s*-\s*(\w+)/g, "$1$2")

      // Remove excessive whitespace
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n")

      // Fix sentence endings
      .replace(/([.!?])\s*([a-z])/g, "$1 $2")

      .trim()
  );
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

          // Extract regular text first
          const textContent = await page.getTextContent();
          const pageText = formatPageText(textContent);

          let finalPageText = "";

          // Check if page has significant text content
          if (hasSignificantText(textContent)) {
            console.log(
              `Page ${i} has significant text content, using extracted text`
            );
            finalPageText = pageText;
          } else {
            console.log(
              `Page ${i} has minimal text content, attempting OCR...`
            );
            const canvas = await renderPageToCanvas(page);
            const imageText = await extractTextFromImage(canvas.toBuffer());
            finalPageText = imageText;
          }

          // If still no text, try OCR as fallback
          if (!finalPageText.trim() && !hasSignificantText(textContent)) {
            console.log(`Page ${i} has no text, trying OCR as fallback...`);
            const canvas = await renderPageToCanvas(page);
            const imageText = await extractTextFromImage(canvas.toBuffer());
            finalPageText = imageText;
          }

          if (finalPageText.trim()) {
            // Clean the text more thoroughly
            const cleanedText = cleanText(finalPageText);
            if (cleanedText.trim()) {
              extractedText += `Page ${i}:\n${cleanedText}\n\n`;
              console.log(`Page ${i} text length:`, cleanedText.length);
              console.log(
                `Page ${i} first 100 chars:`,
                cleanedText.substring(0, 100)
              );
            } else {
              console.log(
                `Warning: No meaningful text extracted from page ${i} after cleaning`
              );
            }
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

      // Apply final text enhancement
      console.log("Applying final text enhancement...");
      const enhancedText = enhanceExtractedText(extractedText);
      console.log("Enhanced text length:", enhancedText.length);
      console.log(
        "First 200 characters of enhanced text:",
        enhancedText.substring(0, 200)
      );

      // Save to Document model
      console.log("\nPreparing to save to Document model...");
      const documentData = {
        source: "PDF Upload",
        title: req.file.originalname,
        content: enhancedText,
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

      // RAG: Split content into chunks, embed, and store in DocumentEmbedding
      const chunkSize = 1000; // characters per chunk
      const overlapSize = 200; // characters of overlap between chunks
      const content = savedDocument.content;
      const numChunks = Math.ceil(
        (content.length - overlapSize) / (chunkSize - overlapSize)
      );
      const chunkPromises = [];

      for (let i = 0; i < numChunks; i++) {
        const start = i * (chunkSize - overlapSize);
        const end = Math.min(start + chunkSize, content.length);
        const chunkText = content.substring(start, end);

        // Skip very short chunks
        if (chunkText.length < 50) continue;

        chunkPromises.push(
          (async () => {
            try {
              const embedding = await (
                await import("../services/ollamaService.js")
              ).default.generateEmbedding(chunkText);
              await (
                await import("../models/DocumentEmbedding.js")
              ).default.create({
                docId: savedDocument._id,
                embedding,
                chunkIndex: i,
                chunkText: chunkText,
                startChar: start,
                endChar: end,
              });
            } catch (err) {
              console.error(`Failed to embed chunk ${i + 1}:`, err);
            }
          })()
        );
      }
      await Promise.all(chunkPromises);
      console.log(
        `Stored ${numChunks} chunk embeddings for document with overlap.`
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

// Utility function to re-embed existing documents
export const reEmbedDocuments = async (req, res, next) => {
  try {
    console.log("Starting re-embedding process for existing documents...");

    // Get all documents that don't have embeddings
    const documents = await Document.find({});
    let processedCount = 0;
    let errorCount = 0;

    for (const doc of documents) {
      try {
        // Check if document already has embeddings
        const existingEmbeddings = await DocumentEmbedding.find({
          docId: doc._id,
        });
        if (existingEmbeddings.length > 0) {
          console.log(
            `Document "${doc.title}" already has ${existingEmbeddings.length} embeddings, skipping...`
          );
          continue;
        }

        console.log(`Processing document: ${doc.title}`);

        // Delete any existing embeddings for this document
        await DocumentEmbedding.deleteMany({ docId: doc._id });

        // Split content into chunks with overlap
        const chunkSize = 1000;
        const overlapSize = 200;
        const content = doc.content;
        const numChunks = Math.ceil(
          (content.length - overlapSize) / (chunkSize - overlapSize)
        );

        const chunkPromises = [];
        for (let i = 0; i < numChunks; i++) {
          const start = i * (chunkSize - overlapSize);
          const end = Math.min(start + chunkSize, content.length);
          const chunkText = content.substring(start, end);

          if (chunkText.length < 50) continue;

          chunkPromises.push(
            (async () => {
              try {
                const embedding = await (
                  await import("../services/ollamaService.js")
                ).default.generateEmbedding(chunkText);
                await DocumentEmbedding.create({
                  docId: doc._id,
                  embedding,
                  chunkIndex: i,
                  chunkText: chunkText,
                  startChar: start,
                  endChar: end,
                });
              } catch (err) {
                console.error(
                  `Failed to embed chunk ${i + 1} for document ${doc.title}:`,
                  err
                );
                throw err;
              }
            })()
          );
        }

        await Promise.all(chunkPromises);
        console.log(
          `Successfully embedded ${numChunks} chunks for document: ${doc.title}`
        );
        processedCount++;
      } catch (error) {
        console.error(`Error processing document ${doc.title}:`, error);
        errorCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Re-embedding complete. Processed: ${processedCount}, Errors: ${errorCount}`,
      data: {
        processedCount,
        errorCount,
        totalDocuments: documents.length,
      },
    });
  } catch (error) {
    console.error("Re-embedding error:", error);
    next(createError(500, `Re-embedding failed: ${error.message}`));
  }
};
