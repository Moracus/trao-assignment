import { Router } from "express";
import { getMe, login, logout, register } from "../controllers/auth.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router()

router.post("/auth/register",register);
router.post("/auth/login", login)
router.post("/auth/logout",logout)
router.get("/auth/me",protect,getMe)