import express from "express";
import {
  translateSegment,
  generateCopy,
  copilotChat,
} from "../controllers/aiController";

const router = express.Router();

router.post("/translate-segment", translateSegment);
router.post("/generate-copy", generateCopy);
router.post("/copilot-chat", copilotChat);

export default router;
