import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import * as kit from "../controllers/kit.controller.js";

const router = Router();

router.post("/", protect, kit.createKit);

router.get("/", protect, kit.getKits);

router.get("/:id", protect, kit.getKit);

router.patch("/:id", protect, kit.updateKit);

router.delete("/:id", protect, kit.deleteKit);

router.post("/:id/regenerate", protect, kit.regenerateKit);

router.get("/:id/events", protect, kit.streamKit);

export default router;