# ✦ Personal AI (Pixel-Perfect RAG)

A professional, multi-AI RAG application with a modern React frontend and FastAPI backend.

## 📁 Project Structure
- **/frontend**: Next.js (React) application with Tailwind CSS.
- **/backend**: FastAPI server handling LangChain and FAISS logic.

## 🚀 Getting Started

### 1. Setup Backend
1. Go to `backend/` folder.
2. Ensure you have your `.env` file with API keys.
3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server:
   ```bash
   python3 main.py
   ```

### 2. Setup Frontend
1. Go to `frontend/` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Vercel Deployment

This repository is not a single root-level Next.js app. The web app lives in `frontend/`.

If you deploy this repo to Vercel, set:
- `Root Directory` to `frontend`
- `Framework Preset` to `Next.js`
- `NEXT_PUBLIC_API_BASE_URL` to your deployed backend URL

Example:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend.example.com
```

The FastAPI backend is separate from the Vercel frontend deployment. If you only deploy the frontend and leave the API URL as `http://localhost:8000`, the site will load but chat and knowledge processing will fail.

## 🎨 Features
- **Pixel-Perfect UI**: 100% matched to Figma redesign.
- **Multi-AI**: Toggle between Gemini, OpenAI, Claude, and DeepSeek.
- **Local RAG**: Free and fast document processing using local embeddings.
- **Broad File Support**: Ingest PDF, Word, Excel, PowerPoint, text formats, images, audio, video, and websites.
- **Smart Fallback**: Intelligent switching between knowledge base and general chat.
