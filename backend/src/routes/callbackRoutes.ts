import express from "express";
import { handleReceiptCallback, getLogs } from "../controllers/callbackController";

const router = express.Router();

router.post("/receipt", handleReceiptCallback);
router.get("/logs", getLogs);

export default router;
