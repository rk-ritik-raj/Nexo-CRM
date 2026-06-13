import { Request, Response } from "express";
import axios from "axios";
import Campaign from "../models/Campaign";
import Segment from "../models/Segment";
import Customer from "../models/Customer";
import CommunicationLog from "../models/CommunicationLog";
import { buildMongoQuery } from "../utils/queryBuilder";

// Helper to generate a short unique token
const generateToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Personalize message template
const personalizeMessage = (template: string, customer: any, trackingId: string) => {
  let text = template;
  text = text.replace(/{name}/gi, customer.name || "");
  text = text.replace(/{totalSpend}/gi, `$${customer.totalSpend || 0}`);
  text = text.replace(/{lastPurchaseDate}/gi, customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toLocaleDateString() : "Never");
  text = text.replace(/{email}/gi, customer.email || "");
  text = text.replace(/{phone}/gi, customer.phone || "");
  text = text.replace(/{city}/gi, customer.city || "");
  
  // Append a standard tracking link if not already present in the template
  const trackingLink = `https://nexo-crm-2.onrender.com/sandbox?t=${trackingId}`;
  if (!text.includes("https://nexo-crm-2.onrender.com/sandbox")) {
    text = `${text} Click here to shop: ${trackingLink}`;
  }
  return text;
};

export const createCampaign = async (req: Request, res: Response) => {
  try {
    const { name, description, segmentId, channel, messageTemplate } = req.body;
    const campaign = await Campaign.create({
      name,
      description,
      segmentId: segmentId || null,
      channel,
      messageTemplate,
      status: "draft",
    });
    res.status(201).json(campaign);
  } catch (error: any) {
    res.status(500).json({
      message: "Error creating campaign",
      error: error.message,
    });
  }
};

export const getCampaigns = async (req: Request, res: Response) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error: any) {
    res.status(500).json({
      message: "Error fetching campaigns",
      error: error.message,
    });
  }
};

export const getCampaignDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id).populate("segmentId");
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const logs = await CommunicationLog.find({ campaignId: id }).populate("customerId");
    res.json({
      campaign,
      logs,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Error fetching campaign details",
      error: error.message,
    });
  }
};

export const sendCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    if (campaign.status === "sending") {
      return res.status(400).json({ message: "Campaign is already sending" });
    }

    // Determine target customers
    let targetQuery = {};
    if (campaign.segmentId) {
      const segment = await Segment.findById(campaign.segmentId);
      if (segment) {
        targetQuery = buildMongoQuery(segment.rules);
      }
    }
    const targetCustomers = await Customer.find(targetQuery);

    if (targetCustomers.length === 0) {
      return res.status(400).json({ message: "Target segment has no customers" });
    }

    // Update status to sending
    campaign.status = "sending";
    campaign.sentCount = targetCustomers.length;
    campaign.deliveredCount = 0;
    campaign.failedCount = 0;
    campaign.openedCount = 0;
    campaign.readCount = 0;
    campaign.clickedCount = 0;
    campaign.convertedCount = 0;
    campaign.totalRevenueGenerated = 0;
    await campaign.save();

    // Respond immediately, processing the send asynchronously in the background
    res.json({ message: "Campaign sending started", targetCount: targetCustomers.length });

    // Background process for sending
    (async () => {
      let successCount = 0;
      let failCount = 0;

      for (const customer of targetCustomers) {
        const trackingId = generateToken();
        const personalizedMsg = personalizeMessage(campaign.messageTemplate, customer, trackingId);

        // Save CommunicationLog
        const log = await CommunicationLog.create({
          campaignId: campaign._id,
          customerId: customer._id,
          channel: campaign.channel,
          messageText: personalizedMsg,
          status: "sent",
          trackingId,
        });

        try {
          // POST to Channel Service
          await axios.post("https://nexo-crm-1.onrender.com/api/send", {
            trackingId,
            recipient: {
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
            },
            message: personalizedMsg,
            channel: campaign.channel,
          });
          successCount++;
        } catch (err: any) {
          console.error(`Failed to send to channel service for trackingId: ${trackingId}`, err.message);
          // Update log to failed
          log.status = "failed";
          log.errorMessage = err.message || "Failed to reach Channel Service";
          await log.save();
          failCount++;
        }
      }

      // Update campaign summary stats
      campaign.status = "completed";
      campaign.failedCount = failCount;
      await campaign.save();
      console.log(`Campaign ${campaign._id} finished sending: ${successCount} queued, ${failCount} failed.`);
    })().catch((err) => {
      console.error("Critical error in background campaign dispatcher", err);
    });

  } catch (error: any) {
    res.status(500).json({
      message: "Error launching campaign",
      error: error.message,
    });
  }
};
