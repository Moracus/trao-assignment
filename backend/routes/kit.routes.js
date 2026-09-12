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

router.patch("/:kitId/builder/questions/reorder", protect, kit.reorderQuestions);
router.patch("/:kitId/builder/questions/:id", protect, kit.updateQuestion);
router.post("/:kitId/builder/questions", protect, kit.createQuestion);
router.delete("/:kitId/builder/questions/:id", protect, kit.deleteQuestion);
router.patch("/:kitId/builder/questions/:id/move", protect, kit.moveQuestion);

router.patch("/:kitId/builder/flashcards/:id", protect, kit.updateFlashcard);
router.post("/:kitId/builder/flashcards", protect, kit.createFlashcard);
router.delete("/:kitId/builder/flashcards/:id", protect, kit.deleteFlashcard);

router.patch("/:kitId/builder/company-brief", protect, kit.updateCompanyBrief);

export default router;