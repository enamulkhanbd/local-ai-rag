# ✦ Multi-AI Knowledge Assistant

A powerful, local RAG (Retrieval-Augmented Generation) application that lets you "feed" PDFs or Websites to multiple AI providers including **Gemini, OpenAI, Claude, and DeepSeek**.

## 🚀 Features
- **Multi-Provider Support**: Switch between AI brains from the sidebar.
- **Local Embeddings**: Uses `sentence-transformers` locally, so processing documents is **free and fast** for all providers.
- **Multiple File Upload**: Feed several PDFs at once to build a comprehensive knowledge base.
- **Smart Fallback**: If the answer isn't in your documents, the AI automatically falls back to its general knowledge.
- **Secure Configuration**: No API keys are exposed in the UI.

## 🛠️ Setup

### 1. Install Dependencies
Make sure you have Python installed, then run:
```bash
pip install streamlit langchain-google-genai langchain-openai langchain-anthropic langchain-huggingface faiss-cpu pypdf beautifulsoup4 python-dotenv
```

### 2. Configure API Keys (.env)
This app uses a `.env` file for secure configuration. 
1. Create a file named `.env` in the root directory.
2. Add your API keys like this (only add the ones you want to use):

```env
GOOGLE_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_claude_key
DEEPSEEK_API_KEY=your_deepseek_key
```

> **Note:** The app will only show providers in the sidebar for which you have provided a key in the `.env` file.

### 3. Run the App
```bash
python3 -m streamlit run app.py
```

## 📖 How to Use
1. **Select Provider**: Pick your preferred AI from the sidebar.
2. **Feed Knowledge**: Upload one or more PDFs or enter a website URL.
3. **Initialize**: Click "Initialize Knowledge Base".
4. **Chat**: Ask questions! The AI will look at your documents first, then fallback to general knowledge if needed.

---
*Built with LangChain and Streamlit.*
