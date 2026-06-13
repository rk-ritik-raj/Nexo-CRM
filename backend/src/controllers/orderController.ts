import { Request, Response } from "express";
import Order from "../models/Order";
import Customer from "../models/Customer";
import CommunicationLog from "../models/CommunicationLog";
import Campaign from "../models/Campaign";
import { recalculateCampaignStats } from "./callbackController";

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { customerId, amount, items, trackingId } = req.body;

    if (!customerId || amount === undefined) {
      return res.status(400).json({ message: "customerId and amount are required" });
    }

    // Create the order
    const order = await Order.create({
      customerId,
      amount: Number(amount),
      items: Number(items || 1),
      status: "completed",
    });

    // 1. Update customer profile (total spend & last purchase date)
    const customer = await Customer.findById(customerId);
    if (customer) {
      customer.totalSpend = (customer.totalSpend || 0) + Number(amount);
      customer.lastPurchaseDate = new Date();
      await customer.save();
    }

    // 2. Perform campaign attribution
    let attributedLog = null;

    if (trackingId) {
      // Direct link-click attribution
      attributedLog = await CommunicationLog.findOne({ trackingId });
    } else {
      // 7-day view-through attribution (fallback)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      attributedLog = await CommunicationLog.findOne({
        customerId,
        status: { $in: ["sent", "delivered", "opened", "read", "clicked"] },
        createdAt: { $gte: sevenDaysAgo },
      }).sort({ createdAt: -1 }); // Get the most recent communication
    }

    if (attributedLog && attributedLog.status !== "converted") {
      attributedLog.status = "converted";
      await attributedLog.save();

      // Update the campaign's revenue and counts
      const campaign = await Campaign.findById(attributedLog.campaignId);
      if (campaign) {
        campaign.convertedCount = (campaign.convertedCount || 0) + 1;
        campaign.totalRevenueGenerated = (campaign.totalRevenueGenerated || 0) + Number(amount);
        await campaign.save();

        // Recalculate stats for safety
        await recalculateCampaignStats(campaign._id);
      }
    }

    res.status(201).json(order);
  } catch (error: any) {
    console.error("Error creating order:", error);
    res.status(500).json({
      message: "Error creating order",
      error: error.message,
    });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate("customerId");
    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching orders",
    });
  }
};