import OpenAI from "openai";

export async function embed(text) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return res.data[0].embedding;
}