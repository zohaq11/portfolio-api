import pdf from "pdf-parse";
import fs from "fs";
import path from "path";

let cached = null;

export async function loadResume() {
  if (cached) return cached;

  const filePath = path.join(
    process.cwd(),
    "public",
    "Zoha_Qamar_Resume.pdf"
  );

  const buffer = fs.readFileSync(filePath);

  const data = await pdf(buffer);

  cached = data.text;

  return cached;
}