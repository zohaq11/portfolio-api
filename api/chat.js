import "dotenv/config";
import OpenAI from "openai";
import { getRelevantContext } from "./rag/retrieve.js";

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY,});

const rateLimitMap = new Map();

function rateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

  const entry = rateLimitMap.get(ip) || { count: 0, start: now };

  if (now - entry.start > windowMs) {
    entry.count = 0;
    entry.start = now;
  }

  entry.count += 1;
  rateLimitMap.set(ip, entry);

  return entry.count <= maxRequests;
}

export default async function handler(req, res) {
  
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://zohaq11.github.io"
  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      error: "Origin not allowed"
    });
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || "unknown";

  if (!rateLimit(ip)) {
    return res.status(429).json({error: "Too many requests. Please slow down."});
  }

  try {
    const { messages } = req.body;

    if (
      !Array.isArray(messages) ||
      messages.length === 0 ||
      messages.length > 50
    ) {
      return res.status(400).json({
        error: "Invalid conversation history."
      });
    }

    const validMessages = messages.every(
      message =>
        message &&
        ["user", "assistant"].includes(message.role) &&
        typeof message.content === "string" &&
        message.content.trim().length > 0
    );

    if (!validMessages) {
      return res.status(400).json({
        error: "Invalid message format."
      });
    }

    // Keep the most recent 12 messages for the model
    const recentMessages = messages.slice(-12);

    // Use recent conversation for RAG retrieval
    const retrievalQuery = recentMessages
      .slice(-6)
      .map(message => `${message.role}: ${message.content}`)
      .join("\n");

  const context = await getRelevantContext(retrievalQuery);

    const response = await openai.chat.completions.create({
      model: "gpt-6-astra",
      messages: [
        {
          role: "system",
          content: `
You are ZohaBot, an AI assistant on Zoha's personal portfolio website.

Your ONLY purpose is to answer questions related to Zoha in third person using:
1. the retrieved context
2. the ongoing conversation

RULES:
- Only answer questions related to Zoha
- If the information is not available in either the conversation or retrieved context, say:
"I don't have that information."
- Do not invent facts or hallucinate.
- If a user asks for anything unrelated to Zoha, politely decline.
- Be concise and conversational

CONTEXT:
${context}
          `.trim(),
        },
        ...recentMessages,
      ],
      max_completion_tokens: 500,
    });

    res.status(200).json(response);
  } catch (err) {
    console.error("ZohaBot API error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}