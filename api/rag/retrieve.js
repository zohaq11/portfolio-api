import { embed } from "./embed.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

let chunks = null;
let chunkEmbeddings = null;

/**
 * Split resume into chunks based on existing Resume sections
 */
export function chunkResume(text) {
  const sections = {
    education: [],
    experience: [],
    projects: [],
    skills: [],
    other: [],
  };

  const lines = text.split("\n");

  let current = "other";

  for (const line of lines) {
    const l = line.toLowerCase();
    
    if (l.includes("education")) current = "education";
    else if (l.includes("experience")) current = "experience";
    else if (l.includes("project")) current = "projects";
    else if (l.includes("skills")) current = "skills";

    if (line.trim().length > 20) {
      sections[current].push(line.trim());
    }
  }

  return Object.entries(sections).map(([key, val]) => ({
    section: key,
    text: val.join(" "),
  }));
}

/**
 * cosine similarity
 */
function dot(a, b) {
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}

function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);

  const normA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const normB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));

  return dot / (normA * normB);
}

/**
 * Initialize once per cold start
 */
async function init() {
  if (chunks) return;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const embeddingsPath = path.join(__dirname, "embeddings.json");

  const raw = fs.readFileSync(embeddingsPath, "utf-8");

  const data = JSON.parse(raw);

  chunks = data.map(d => ({
    section: d.section,
    text: d.text,
  }));

  chunkEmbeddings = data.map(d => d.embedding);
}

/**
 * MAIN RETRIEVAL FUNCTION
 */
export async function getRelevantContext(query) {
  await init();

  const queryEmbedding = await embed(query);

  const scored = chunks.map((c, i) => ({
    score: cosineSimilarity(queryEmbedding, chunkEmbeddings[i]),
    chunk: c,
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored
  .filter(s => s.score > 0.3)
  .slice(0, 3)
  .map(s => `[${s.chunk.section.toUpperCase()}]\n${s.chunk.text}`)
  .join("\n\n");
}