import { Request, Response } from "express";
import CommunicationLog from "../models/CommunicationLog";
import Campaign from "../models/Campaign";

// Status progression level mapping
const STATUS_LEVELS: { [key: string]: number } = {
  sent: 0,
  failed: 1,
  delivered: 2,
  opened: 3,
  read: 4,
  clicked: 5,
  converted: 6,
};

// Helper to recalculate stats safely
export const recalculateCampaignStats = async (campaignId: any) => {
  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return;

    campaign.failedCount = await CommunicationLog.countDocuments({
      campaignId,
      status: "failed",
    });

    campaign.deliveredCount = await CommunicationLog.countDocuments({
      campaignId,
      status: { $in: ["delivered", "opened", "read", "clicked", "converted"] },
    });

    campaign.openedCount = await CommunicationLog.countDocuments({
      campaignId,
      status: { $in: ["opened", "read", "clicked", "converted"] },
    });

    campaign.readCount = await CommunicationLog.countDocuments({
      campaignId,
      status: { $in: ["read", "clicked", "converted"] },
    });

    campaign.clickedCount = await CommunicationLog.countDocuments({
      campaignId,
      status: { $in: ["clicked", "converted"] },
    });

    campaign.convertedCount = await CommunicationLog.countDocuments({
      campaignId,
      status: "converted",
    });

    await campaign.save();
  } catch (err) {
    console.error("Error recalculating campaign stats:", err);
  }
};

export const handleReceiptCallback = async (req: Request, res: Response) => {
  try {
    const { trackingId, status, errorMessage } = req.body;

    if (!trackingId || !status) {
      return res.status(400).json({ message: "trackingId and status are required" });
    }

    const log = await CommunicationLog.findOne({ trackingId });
    if (!log) {
      return res.status(404).json({ message: "Communication log not found" });
    }

    const currentLevel = STATUS_LEVELS[log.status] || 0;
    const newLevel = STATUS_LEVELS[status] || 0;

    // Only progress status forward.
    if (newLevel > currentLevel || (status === "failed" && log.status === "sent")) {
      log.status = status;
      if (errorMessage) {
        log.errorMessage = errorMessage;
      }
      await log.save();

      // Recalculate campaign stats in the background
      recalculateCampaignStats(log.campaignId).catch((err) => {
        console.error("Failed to recalculate campaign stats in callback", err);
      });
    }

    res.json({ message: "Callback processed successfully", trackingId, status: log.status });
  } catch (error: any) {
    res.status(500).json({
      message: "Error processing callback",
      error: error.message,
    });
  }
};

// Fetch all communication logs sorted by date (latest first)
export const getLogs = async (req: Request, res: Response) => {
  try {
    const logs = await CommunicationLog.find()
      .sort({ createdAt: -1 })
      .populate("customerId")
      .populate("campaignId");
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({
      message: "Error fetching logs",
      error: error.message,
    });
  }
};
