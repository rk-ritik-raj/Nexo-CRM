import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    items: {
      type: Number,
      default: 1,
    },

    status: {
      type: String,
      default: "completed",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Order", orderSchema);                