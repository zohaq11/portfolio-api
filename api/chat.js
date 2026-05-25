import "dotenv/config";
import OpenAI from "openai";
import { getRelevantContext } from "./rag/retrieve.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  });

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

  const ip =
  req.headers["x-forwarded-for"]?.split(",")[0] ||
  "unknown";

  if (!rateLimit(ip)) {
    return res.status(429).json({
      error: "Too many requests. Please slow down."
    });
  }

  try {
    const { messages, model, max_tokens } = req.body;

    const recentMessages = messages
    .slice(-6)
    .map(m => `${m.role}: ${m.content}`)
    .join("\n");

  const context = await getRelevantContext(recentMessages);

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `
You are ZohaBot, an AI assistant on Zoha's personal portfolio website.

Your ONLY purpose is to answer questions related to Zoha using:
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
        ...messages,
      ],
      max_tokens,
    });

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}