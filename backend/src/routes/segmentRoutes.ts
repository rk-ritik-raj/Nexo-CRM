import express from "express";
import {
  createSegment,
  getSegments,
  getSegmentDetails,
  previewSegment,
  deleteSegment,
} from "../controllers/segmentController";

const router = express.Router();

router.get("/", getSegments);
router.post("/", createSegment);
router.post("/preview", previewSegment);
router.get("/:id", getSegmentDetails);
router.delete("/:id", deleteSegment);

export default router;
