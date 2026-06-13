import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sendRoutes from "./routes/sendRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 6000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/send", sendRoutes);

app.get("/", (req, res) => {
  res.send("Channel Simulator Service Running");
});

app.listen(PORT, () => {
  console.log(`Channel Simulator running on port ${PORT}`);
});
