import { Router } from "express";
import { checkUsername, getMe, login, logout, register } from "../controllers/auth.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router()

router.post("/register",register);
router.post("/login", login)
router.post("/logout",logout)
router.get("/me",protect,getMe)
router.get("/check-username",checkUsername) //?checkusername=

export default router