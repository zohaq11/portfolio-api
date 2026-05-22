import "dotenv/config";
import OpenAI from "openai";
import { getRelevantContext } from "./rag/retrieve.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  });

export default async function handler(req, res) {
  
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

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