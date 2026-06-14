import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db";
import customerRoutes from "./routes/customerRoutes";
import orderRoutes from "./routes/orderRoutes";
import segmentRoutes from "./routes/segmentRoutes";
import campaignRoutes from "./routes/campaignRoutes";
import callbackRoutes from "./routes/callbackRoutes";
import aiRoutes from "./routes/aiRoutes";

dotenv.config();

connectDB();

const app = express();

// app.use(cors());
app.use(
  cors({
    origin: [
      "https://nexo-crm-2.onrender.com",
      'https://nexo-crm-frontend.onrender.com'
    ] // Update this to your frontend URL

    credentials: true,
  })
);
app.use(express.json());

app.use("/api/customers", customerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/segments", segmentRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/callbacks", callbackRoutes);
app.use("/api/ai", aiRoutes);

app.get("/", (req, res) => {
  res.send("CRM API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});