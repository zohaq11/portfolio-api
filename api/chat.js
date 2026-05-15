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

    const userMessage = messages
      .filter(m => m.role === "user")
      .slice(-1)[0].content;

    const context = await getRelevantContext(userMessage);

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `
You are ZohaBot, a strict resume-based assistant.

RULES:
- Only use the provided context
- If info is missing, say you don't know
- Do NOT hallucinate
- Be concise

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