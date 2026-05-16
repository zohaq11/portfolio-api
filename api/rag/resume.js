import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

let cached = null;

export async function loadResume() {
  if (cached) return cached;

  const filePath = path.join(
    process.cwd(),
    "public",
    "Zoha_Qamar_Resume.pdf"
  );

  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);

  cached = data.text;
  return cached;
}