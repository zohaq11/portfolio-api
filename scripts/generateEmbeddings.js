import fs from "fs";
import { loadResume } from "../api/rag/resume.js";
import { embed } from "../api/rag/embed.js";
import { personalFacts } from "../api/rag/personal.js";
import { chunkResume } from "../api/rag/retrieve.js";

async function main() {
  const resume = await loadResume();

  const resumeChunks = chunkResume(resume);

  const personalChunks = personalFacts.map(p => ({
    section: `personal_${p.section}`,
    text: p.text,
  }));

  const chunks = [...resumeChunks, ...personalChunks];

  const embeddings = await Promise.all(
    chunks.map(c => embed(c.text))
  );

  const data = chunks.map((c, i) => ({
    ...c,
    embedding: embeddings[i],
  }));

  fs.writeFileSync(
    "./api/rag/embeddings.json",
    JSON.stringify(data)
  );

  console.log("Embeddings saved");
}

main();