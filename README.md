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

## 🎨 Features
- **Pixel-Perfect UI**: 100% matched to Figma redesign.
- **Multi-AI**: Toggle between Gemini, OpenAI, Claude, and DeepSeek.
- **Local RAG**: Free and fast document processing using local embeddings.
- **Broad File Support**: Ingest PDF, Word, Excel, PowerPoint, text formats, images, audio, video, and websites.
- **Smart Fallback**: Intelligent switching between knowledge base and general chat.
