import { Router } from "express";
import { buildKit } from "../controllers/kit.controller.js";

const router = Router();

router.post("",buildKit);

export default router;
