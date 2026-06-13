import { Request, Response } from "express";
import Segment from "../models/Segment";
import Customer from "../models/Customer";
import { buildMongoQuery } from "../utils/queryBuilder";

export const previewSegment = async (req: Request, res: Response) => {
  try {
    const { rules } = req.body;
    const mongoQuery = buildMongoQuery(rules);
    const customers = await Customer.find(mongoQuery);
    res.json({
      size: customers.length,
      customers,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Error previewing segment",
      error: error.message,
    });
  }
};

export const createSegment = async (req: Request, res: Response) => {
  try {
    const { name, description, rules } = req.body;
    const mongoQuery = buildMongoQuery(rules);
    
    // Count matching customers
    const size = await Customer.countDocuments(mongoQuery);

    const segment = await Segment.create({
      name,
      description,
      rules,
      query: mongoQuery,
      size,
    });

    res.status(201).json(segment);
  } catch (error: any) {
    res.status(500).json({
      message: "Error creating segment",
      error: error.message,
    });
  }
};

export const getSegments = async (req: Request, res: Response) => {
  try {
    const segments = await Segment.find().sort({ createdAt: -1 });
    res.json(segments);
  } catch (error: any) {
    res.status(500).json({
      message: "Error fetching segments",
      error: error.message,
    });
  }
};

export const getSegmentDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const segment = await Segment.findById(id);
    if (!segment) {
      return res.status(404).json({ message: "Segment not found" });
    }

    // Refresh size and get customers
    const mongoQuery = buildMongoQuery(segment.rules);
    const customers = await Customer.find(mongoQuery);
    
    if (segment.size !== customers.length) {
      segment.size = customers.length;
      segment.query = mongoQuery;
      await segment.save();
    }

    res.json({
      segment,
      customers,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Error fetching segment details",
      error: error.message,
    });
  }
};

export const deleteSegment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Segment.findByIdAndDelete(id);
    res.json({ message: "Segment deleted successfully" });
  } catch (error: any) {
    res.status(500).json({
      message: "Error deleting segment",
      error: error.message,
    });
  }
};
