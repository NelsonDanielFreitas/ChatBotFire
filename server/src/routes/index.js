import express from "express";
import userRoutes from "./userRoutes.js";
import chatRoutes from "./chatRoutes.js";
import authRoutes from "./authRoutes.js";

const router = express.Router();

// Mount routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/chat", chatRoutes);

export default router;
