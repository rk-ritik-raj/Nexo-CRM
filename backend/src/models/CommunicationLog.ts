import mongoose from "mongoose";

const communicationLogSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    channel: {
      type: String,
      required: true,
      enum: ["whatsapp", "sms", "email", "rcs"],
    },
    messageText: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "sent",
        "delivered",
        "failed",
        "opened",
        "read",
        "clicked",
        "converted",
      ],
      default: "sent",
    },
    trackingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    errorMessage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("CommunicationLog", communicationLogSchema);
