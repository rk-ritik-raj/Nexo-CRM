import { Request, Response } from "express";
import axios from "axios";

const CRM_CALLBACK_URL = "https://nexo-crm-jjow.onrender.com/api/callbacks/receipt";

// Helper for setTimeout using promises (optional) or just standard setTimeout
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const sendCrmCallback = async (trackingId: string, status: string, errorMessage?: string) => {
  try {
    await axios.post(CRM_CALLBACK_URL, {
      trackingId,
      status,
      errorMessage,
    });
    console.log(`[Callback Sent] TrackingId: ${trackingId} -> Status: ${status}`);
  } catch (err: any) {
    console.error(`[Callback Failed] Failed to post callback for ${trackingId}: ${err.message}`);
  }
};

export const handleSend = async (req: Request, res: Response) => {
  try {
    const { trackingId, recipient, message, channel } = req.body;

    if (!trackingId || !recipient) {
      return res.status(400).json({ message: "trackingId and recipient are required" });
    }

    console.log(`[Send Request] Received message for ${recipient.name || recipient.email || recipient.phone} via ${channel}`);

    // 1. Respond immediately to the CRM
    res.status(202).json({
      status: "queued",
      trackingId,
      message: "Message queued for asynchronous delivery",
    });

    // 2. Asynchronously process delivery pipeline
    (async () => {
      // Step 1: Delivery status simulation (Wait 1.5 seconds)
      await delay(1500);

      const isFailure =
        Math.random() < 0.1 || // 10% random fail rate
        recipient.phone?.includes("fail") ||
        recipient.email?.includes("fail") ||
        message.toLowerCase().includes("simulate-fail");

      if (isFailure) {
        await sendCrmCallback(
          trackingId,
          "failed",
          "Carrier network timeout / Invalid contact address"
        );
        return; // Delivery failed, terminate loop
      }

      // Mark as delivered
      await sendCrmCallback(trackingId, "delivered");

      // Step 2: Open status simulation (Wait 1.5 - 3 seconds, 80% open rate)
      await delay(1500 + Math.random() * 1500);
      const isOpened = Math.random() < 0.8;
      if (!isOpened) return;

      await sendCrmCallback(trackingId, "opened");

      // Step 3: Read status simulation (Wait 1 - 2 seconds, 75% read rate)
      await delay(1000 + Math.random() * 1000);
      const isRead = Math.random() < 0.75;
      if (!isRead) return;

      await sendCrmCallback(trackingId, "read");

      // Step 4: Click status simulation (Wait 1.5 - 3 seconds, 40% click rate)
      await delay(1500 + Math.random() * 1500);
      const isClicked = Math.random() < 0.4;
      if (!isClicked) return;

      await sendCrmCallback(trackingId, "clicked");
    })().catch((err) => {
      console.error(`[Pipeline Error] Error in background simulator for ${trackingId}:`, err);
    });

  } catch (error: any) {
    console.error("Error handling send request:", error);
    res.status(500).json({
      message: "Error queueing send request",
      error: error.message,
    });
  }
};
