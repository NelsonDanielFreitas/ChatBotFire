import express from "express";
import {
  register,
  login,
  logout,
  getMe,
} from "../controllers/authController.js";
import {
  validateRegistration,
  validateLogin,
} from "../middleware/validator.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", validateRegistration, register);
router.post("/login", validateLogin, login);
router.get("/logout", logout);
router.get("/me", protect, getMe);

export default router;
