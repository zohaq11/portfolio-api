import pdf from "pdf-parse";

let cached = null;

export async function loadResume() {
  if (cached) return cached;

  const url =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000/Zoha_Qamar_Resume.pdf"
      : "https://zoha-portfolio-api.vercel.app/Zoha_Qamar_Resume.pdf";

  const res = await fetch(url);
  const buffer = await res.arrayBuffer();

  const data = await pdf(Buffer.from(buffer));

  cached = data.text;
  return cached;
}