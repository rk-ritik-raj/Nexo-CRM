import express from "express";
import {
  createCustomer,
  getCustomers,
  ingestSampleData,
} from "../controllers/customerController";

const router = express.Router();

router.post("/", createCustomer);
router.get("/", getCustomers);
router.post("/ingest-sample", ingestSampleData);

export default router;