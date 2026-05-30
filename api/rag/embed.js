import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

const embeddingCache = new Map();

export async function embed(text) {

  const key = text.trim().toLowerCase();

  if (embeddingCache.has(key)) {
    return embeddingCache.get(key);
  }
  
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  const embedding = res.data[0].embedding;

  embeddingCache.set(key, embedding);

  return embedding;
}