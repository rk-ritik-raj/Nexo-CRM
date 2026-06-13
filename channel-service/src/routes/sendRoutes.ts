import express from "express";
import { handleSend } from "../controllers/sendController";

const router = express.Router();

router.post("/", handleSend);

export default router;
