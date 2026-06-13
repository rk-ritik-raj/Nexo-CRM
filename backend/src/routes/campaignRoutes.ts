import express from "express";
import {
  createCampaign,
  getCampaigns,
  getCampaignDetails,
  sendCampaign,
} from "../controllers/campaignController";

const router = express.Router();

router.get("/", getCampaigns);
router.post("/", createCampaign);
router.get("/:id", getCampaignDetails);
router.post("/:id/send", sendCampaign);

export default router;
