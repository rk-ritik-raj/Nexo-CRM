import { Request, Response } from "express";
import axios from "axios";
import Customer from "../models/Customer";
import Campaign from "../models/Campaign";
import Segment from "../models/Segment";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const callGemini = async (prompt: string, responseMimeType?: string) => {
  try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.includes("YOUR_API_KEY")) {
      throw new Error("Invalid or missing GEMINI_API_KEY");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await axios.post(
      url,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: responseMimeType
          ? { responseMimeType }
          : undefined,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const resultText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) {
      throw new Error("Empty response from Gemini API");
    }
    return resultText;
  } catch (err: any) {
    console.warn("Gemini API call failed, using local fallback execution.", err.message);
    throw err;
  }
};

export const translateSegment = async (req: Request, res: Response) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: "Prompt is required" });
  }

  const geminiPrompt = `You are a CRM database segment engineer.
Translate this natural language request into a list of structured JSON segment rules: "${prompt}"

We support these fields, operators, and values:
1. Field: "totalSpend", Operators: "gt" | "lt" | "eq", Value: number
2. Field: "city", Operators: "eq" | "contains", Value: string (e.g. Delhi, Mumbai)
3. Field: "name", Operators: "eq" | "contains", Value: string
4. Field: "phone", Operators: "eq" | "contains", Value: string
5. Field: "lastPurchaseDate", Operators: "lt_days_ago" (purchased MORE than X days ago) | "gt_days_ago" (purchased WITHIN last X days), Value: number (representing days)

Rules format MUST be a valid JSON array:
[
  { "field": "totalSpend", "operator": "gt", "value": 500 },
  ...
]

Return a JSON object with two fields:
{
  "explanation": "A human-readable explanation of the segment",
  "rules": [ ... ]
}

Return ONLY this JSON object. No Markdown code fence (like \`\`\`json) outside it.`;

  try {
    const rawResult = await callGemini(geminiPrompt, "application/json");
    const parsed = JSON.parse(rawResult.trim());
    return res.json(parsed);
  } catch (error) {
    // FALLBACK ENGINE
    console.log("Engaging fallback segment translation rules for:", prompt);
    const text = prompt.toLowerCase();
    const result: any = {
      explanation: `Targeting customers matching: "${prompt}" (Simulated AI Fallback)`,
      rules: [],
    };

    if (text.includes("spend") || text.includes("spent") || text.includes("dollar") || text.includes("rs") || text.includes("more than")) {
      const match = text.match(/\b\d+\b/);
      const val = match ? Number(match[0]) : 500;
      result.rules.push({ field: "totalSpend", operator: "gt", value: val });
    }
    if (text.includes("delhi")) {
      result.rules.push({ field: "city", operator: "eq", value: "Delhi" });
    } else if (text.includes("mumbai")) {
      result.rules.push({ field: "city", operator: "eq", value: "Mumbai" });
    } else if (text.includes("bangalore") || text.includes("bengaluru")) {
      result.rules.push({ field: "city", operator: "eq", value: "Bangalore" });
    } else if (text.includes("london")) {
      result.rules.push({ field: "city", operator: "eq", value: "London" });
    } else if (text.includes("new york")) {
      result.rules.push({ field: "city", operator: "eq", value: "New York" });
    }

    if (text.includes("inactive") || text.includes("last 30 days") || text.includes("not bought") || text.includes("days ago")) {
      const match = text.match(/\b\d+\b/);
      const val = match ? Number(match[0]) : 30;
      result.rules.push({ field: "lastPurchaseDate", operator: "lt_days_ago", value: val });
    } else if (text.includes("active") || text.includes("recent") || text.includes("within")) {
      const match = text.match(/\b\d+\b/);
      const val = match ? Number(match[0]) : 30;
      result.rules.push({ field: "lastPurchaseDate", operator: "gt_days_ago", value: val });
    }

    if (result.rules.length === 0) {
      result.rules.push({ field: "totalSpend", operator: "gt", value: 0 });
    }

    res.json(result);
  }
};

export const generateCopy = async (req: Request, res: Response) => {
  const { channel, segmentDescription, offer, tone } = req.body;

  if (!channel) {
    return res.status(400).json({ message: "Channel is required" });
  }

  const geminiPrompt = `You are an expert consumer marketing copywriter.
Draft a highly converting campaign message for the channel: "${channel}".
The target segment details: "${segmentDescription || "our customers"}".
Additional details / Offer: "${offer || "a special offer"}".
Tone: "${tone || "engaging"}".

You MUST use variables where applicable by inserting bracketed placeholders:
- {name}
- {totalSpend}
- {lastPurchaseDate}
- {email}
- {phone}
- {city}

Return a JSON object with two fields:
{
  "messageTemplate": "The drafted template text",
  "rationale": "A brief explanation of why this copy works well for this segment and tone"
}

Return ONLY this JSON object. No Markdown code fence (like \`\`\`json) outside it.`;

  try {
    const rawResult = await callGemini(geminiPrompt, "application/json");
    const parsed = JSON.parse(rawResult.trim());
    return res.json(parsed);
  } catch (error) {
    // FALLBACK ENGINE
    console.log("Engaging fallback copywriting rules");
    const placeholders = "Hi {name}, we have a special offer for you! You've spent a total of {totalSpend} with us, and we appreciate your loyalty. Use code REWARD10 for 10% off your next purchase!";
    res.json({
      messageTemplate: placeholders,
      rationale: "Crafted a friendly and appreciative message highlighting the customer's total spend to drive repeat purchases.",
    });
  }
};

export const copilotChat = async (req: Request, res: Response) => {
  const { message, chatHistory } = req.body;

  try {
    const customerCount = await Customer.countDocuments();
    const campaignsCount = await Campaign.countDocuments();
    const segmentsCount = await Segment.countDocuments();
    const recentCampaigns = await Campaign.find().sort({ createdAt: -1 }).limit(3);

    const recentCampaignsList = recentCampaigns
      .map(
        (c) =>
          `- ${c.name} (${c.channel}): Sent ${c.sentCount}, Converted ${c.convertedCount}, Revenue $${c.totalRevenueGenerated}`
      )
      .join("\n");

    const historyPrompt = chatHistory
      ?.map((h: any) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
      .join("\n");

    const geminiPrompt = `You are a helpful AI CRM assistant for Xeno.
Here is the context of the current CRM system:
- Total Customers: ${customerCount}
- Total Campaigns Run: ${campaignsCount}
- Total Segments Created: ${segmentsCount}

Recent Campaigns:
${recentCampaignsList || "No campaigns run yet."}

Conversation History:
${historyPrompt || ""}
User: ${message}

Answer the query or help the user brainstorm campaign copy, target segments, or marketing optimization ideas.
Keep your response professional, marketing-savvy, and concise. Format with markdown.`;

    const rawResult = await callGemini(geminiPrompt);
    res.json({ text: rawResult });
  } catch (error) {
    res.json({
      text: "Hello! I am your Xeno AI Co-Pilot. I'm currently running in sandbox offline mode. How can I help you brainstorm your next marketing campaign today?",
    });
  }
};
