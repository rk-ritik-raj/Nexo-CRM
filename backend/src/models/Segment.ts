import mongoose from "mongoose";

const ruleSchema = new mongoose.Schema({
  field: {
    type: String,
    required: true,
    enum: ["totalSpend", "lastPurchaseDate", "city", "name", "phone"],
  },
  operator: {
    type: String,
    required: true,
    enum: ["gt", "lt", "eq", "contains", "lt_days_ago", "gt_days_ago"],
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
});

const segmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    rules: [ruleSchema],
    query: {
      type: mongoose.Schema.Types.Mixed,
    },
    size: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Segment", segmentSchema);
