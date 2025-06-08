import express from "express";
import multer from "multer";
import {
  uploadPdf,
  getAllPdfs,
  getPdfById,
} from "../controllers/pdfController.js";
import { createError } from "../utils/error.js";

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    console.log("\n=== Multer File Filter ===");
    console.log("File details:", {
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: file.size,
    });

    if (file.mimetype === "application/pdf") {
      console.log("File type accepted");
      cb(null, true);
    } else {
      console.log("Invalid file type:", file.mimetype);
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
  limits: {
    fileSize: 20 * 1024 * 1024, // Increased to 20MB limit
  },
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  console.log("\n=== Multer Error Handler ===");
  console.log("Error type:", err.constructor.name);
  console.log("Error details:", {
    message: err.message,
    code: err.code,
    stack: err.stack,
  });

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(createError(400, "File size must be less than 20MB"));
    }
    return next(createError(400, err.message));
  }
  next(err);
};

// Middleware to log request details
const logRequest = (req, res, next) => {
  console.log("\n=== Request Details ===");
  console.log("Method:", req.method);
  console.log("Path:", req.path);
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  console.log("File:", req.file ? "exists" : "does not exist");
  next();
};

// Routes
router.post(
  "/upload",
  logRequest,
  (req, res, next) => {
    console.log("\n=== Before Multer Upload ===");
    next();
  },
  upload.single("pdf"),
  (req, res, next) => {
    console.log("\n=== After Multer Upload ===");
    console.log("File object:", req.file ? "exists" : "does not exist");
    next();
  },
  handleMulterError,
  (req, res, next) => {
    console.log("\n=== Before Controller ===");
    next();
  },
  uploadPdf
);

router.get("/", getAllPdfs);
router.get("/:id", getPdfById);

export default router;
