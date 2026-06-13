import { Request, Response } from "express";
import Customer from "../models/Customer";
import Order from "../models/Order";
import Campaign from "../models/Campaign";
import Segment from "../models/Segment";
import CommunicationLog from "../models/CommunicationLog";

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({
      message: "Error creating customer",
    });
  }
};

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const customers = await Customer.find().sort({ totalSpend: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching customers",
    });
  }
};

// Seed/Reset database with rich mock data
export const ingestSampleData = async (req: Request, res: Response) => {
  try {
    // 1. Wipe current database collections to start fresh
    await Customer.deleteMany({});
    await Order.deleteMany({});
    await Campaign.deleteMany({});
    await Segment.deleteMany({});
    await CommunicationLog.deleteMany({});

    console.log("Database collections cleared for ingestion.");

    // 2. Define rich mock customers
    const mockCustomers = [
      { name: "John Doe", email: "john.doe@gmail.com", phone: "+919876543210", city: "Mumbai" },
      { name: "Alice Smith", email: "alice.smith@yahoo.com", phone: "+919876543211", city: "Delhi" },
      { name: "Bob Johnson", email: "bob.j@hotmail.com", phone: "+919876543212", city: "Delhi" },
      { name: "Emily Davis", email: "emily.d@gmail.com", phone: "+919876543213", city: "Bangalore" },
      { name: "Michael Brown", email: "michael.b@outlook.com", phone: "+447700900077", city: "London" },
      { name: "Sophia Wilson", email: "sophia.w@gmail.com", phone: "+12025550143", city: "New York" },
      { name: "James Garcia", email: "james.garcia@gmail.com", phone: "+919876543214", city: "Mumbai" },
      { name: "Olivia Martinez", email: "olivia.m@gmail.com", phone: "+919876543215", city: "Delhi" },
      { name: "Noah Robinson", email: "noah.r@yahoo.com", phone: "+919876543216", city: "Bangalore" },
      { name: "Emma Rodriguez", email: "emma.rod@gmail.com", phone: "+447700900088", city: "London" },
      { name: "William Lopez", email: "william.l@gmail.com", phone: "+12025550155", city: "New York" },
      { name: "Ava Lee", email: "ava.lee@gmail.com", phone: "+919876543217", city: "Mumbai" },
      { name: "Lucas Chen", email: "lucas.c@outlook.com", phone: "+919876543218", city: "Delhi" },
      { name: "Isabella Wang", email: "isabella.w@gmail.com", phone: "+919876543219", city: "Bangalore" },
      { name: "Liam Miller", email: "liam.m@gmail.com", phone: "+447700900099", city: "London" },
    ];

    const insertedCustomers = [];

    for (const custData of mockCustomers) {
      const customer = await Customer.create({
        ...custData,
        totalSpend: 0,
        lastPurchaseDate: undefined,
      });
      insertedCustomers.push(customer);
    }

    // 3. Define customer order counts and values for realistic histories
    // Array of orders to inject
    const orderHistory = [
      // John Doe (Mumbai) - 3 orders
      { customerIdx: 0, amount: 120, items: 2, daysAgo: 5 },
      { customerIdx: 0, amount: 80, items: 1, daysAgo: 45 },
      { customerIdx: 0, amount: 350, items: 3, daysAgo: 90 },

      // Alice Smith (Delhi) - 2 orders
      { customerIdx: 1, amount: 450, items: 4, daysAgo: 12 },
      { customerIdx: 1, amount: 600, items: 2, daysAgo: 60 },

      // Bob Johnson (Delhi) - 1 order
      { customerIdx: 2, amount: 95, items: 1, daysAgo: 75 },

      // Emily Davis (Bangalore) - 4 orders
      { customerIdx: 3, amount: 150, items: 2, daysAgo: 2 },
      { customerIdx: 3, amount: 200, items: 1, daysAgo: 15 },
      { customerIdx: 3, amount: 300, items: 3, daysAgo: 30 },
      { customerIdx: 3, amount: 450, items: 4, daysAgo: 100 },

      // Michael Brown (London) - 2 orders
      { customerIdx: 4, amount: 75, items: 1, daysAgo: 8 },
      { customerIdx: 4, amount: 110, items: 2, daysAgo: 40 },

      // Sophia Wilson (New York) - 3 orders
      { customerIdx: 5, amount: 500, items: 3, daysAgo: 20 },
      { customerIdx: 5, amount: 750, items: 5, daysAgo: 50 },
      { customerIdx: 5, amount: 1200, items: 6, daysAgo: 120 },

      // James Garcia (Mumbai) - 1 order
      { customerIdx: 6, amount: 130, items: 1, daysAgo: 3 },

      // Olivia Martinez (Delhi) - 0 orders (inactive/non-purchaser)

      // Noah Robinson (Bangalore) - 2 orders
      { customerIdx: 8, amount: 85, items: 1, daysAgo: 18 },
      { customerIdx: 8, amount: 140, items: 2, daysAgo: 55 },

      // Emma Rodriguez (London) - 3 orders
      { customerIdx: 9, amount: 220, items: 2, daysAgo: 4 },
      { customerIdx: 9, amount: 350, items: 3, daysAgo: 25 },
      { customerIdx: 9, amount: 190, items: 1, daysAgo: 80 },

      // William Lopez (New York) - 2 orders
      { customerIdx: 10, amount: 400, items: 2, daysAgo: 10 },
      { customerIdx: 10, amount: 300, items: 1, daysAgo: 35 },

      // Ava Lee (Mumbai) - 1 order
      { customerIdx: 11, amount: 60, items: 1, daysAgo: 28 },

      // Lucas Chen (Delhi) - 2 orders
      { customerIdx: 12, amount: 180, items: 2, daysAgo: 14 },
      { customerIdx: 12, amount: 250, items: 3, daysAgo: 48 },

      // Isabella Wang (Bangalore) - 3 orders
      { customerIdx: 13, amount: 310, items: 3, daysAgo: 6 },
      { customerIdx: 13, amount: 490, items: 4, daysAgo: 22 },
      { customerIdx: 13, amount: 150, items: 1, daysAgo: 70 },

      // Liam Miller (London) - 0 orders
    ];

    for (const orderData of orderHistory) {
      const customer = insertedCustomers[orderData.customerIdx];
      const purchaseDate = new Date();
      purchaseDate.setDate(purchaseDate.getDate() - orderData.daysAgo);

      // Create Order
      await Order.create({
        customerId: customer._id,
        amount: orderData.amount,
        items: orderData.items,
        status: "completed",
        createdAt: purchaseDate,
      });

      // Update Customer aggregates
      customer.totalSpend += orderData.amount;
      if (!customer.lastPurchaseDate || purchaseDate > customer.lastPurchaseDate) {
        customer.lastPurchaseDate = purchaseDate;
      }
    }

    // Save all updated customers
    for (const customer of insertedCustomers) {
      await customer.save();
    }

    res.status(201).json({
      message: "Sample data ingested successfully",
      customersCount: insertedCustomers.length,
      ordersCount: orderHistory.length,
    });
  } catch (error: any) {
    console.error("Error ingesting sample data:", error);
    res.status(500).json({
      message: "Error ingesting sample data",
      error: error.message,
    });
  }
};