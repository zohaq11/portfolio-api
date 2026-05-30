# 🧠 Personal Portfolio Website Backend: ZohaBot API

A production-grade AI backend powering the Zoha Portfolio chatbot.

Built using a lightweight Retrieval-Augmented Generation (RAG) pipeline with OpenAI and serverless architecture.

## 🚀 Live System

- 🌐 Frontend: https://zohaq11.github.io/portfolio
- ⚙️ Backend: Vercel Serverless API

## ✨ Features

- 🤖 AI Chatbot API — OpenAI-powered assistant (ZohaBot)
- 🧠 RAG Pipeline — Semantic retrieval over resume + personal data
- ⚡ Precomputed Embeddings — Fast similarity search using cosine similarity
- 💬 Context Awareness — Uses recent chat history for responses
- 🔒 Scoped Responses — Only answers questions about Zoha
- 🚦 Rate Limiting — Prevents API abuse
- 🌍 CORS Protection — Secure frontend-only access
- ☁️ Serverless Deployment — Scales automatically on Vercel

## 🧠 System Architecture

User Message
→ Embedding Model
→ Cosine Similarity Search
→ Context Injection
→ OpenAI Chat Completion
→ Response


## 🛠️ Tech Stack

- Node.js
- OpenAI API
- Vercel Serverless Functions
- Custom RAG pipeline
- Cosine similarity search
- In-memory caching

## 📁 Project Structure

```txt
api/
 ├── chat.js
 ├── rag/
 │    ├── embed.js
 │    ├── embeddings.json
 │    ├── personal.js
 │    ├── resume.js
 │    ├── retrieve.js
scripts/
 ├── generateEmbeddings.js