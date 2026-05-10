from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import os
import tempfile
import shutil
from dotenv import load_dotenv

# LangChain components
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import PyPDFLoader, WebBaseLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

# --- Load API Keys ---
load_dotenv(override=True)
KEYS = {
    "Gemini": os.getenv("GOOGLE_API_KEY"),
    "OpenAI": os.getenv("OPENAI_API_KEY"),
    "Claude": os.getenv("ANTHROPIC_API_KEY"),
    "DeepSeek": os.getenv("DEEPSEEK_API_KEY"),
    "OpenRouter": os.getenv("OPENROUTER_API_KEY")
}

app = FastAPI()

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global State ---
vector_db = None
doc_count = 0

# --- Helper Functions ---
def get_llm(provider: str):
    if provider == "Gemini":
        return ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3)
    elif provider == "OpenAI":
        return ChatOpenAI(model="gpt-4o-mini", temperature=0.3)
    elif provider == "Claude":
        return ChatAnthropic(model="claude-3-5-sonnet-20240620", temperature=0.3)
    elif provider == "DeepSeek":
        return ChatOpenAI(
            model="deepseek-chat",
            openai_api_key=KEYS["DeepSeek"],
            openai_api_base="https://api.deepseek.com/v1",
            temperature=0.3
        )
    elif provider == "OpenRouter":
        return ChatOpenAI(
            model="deepseek/deepseek-chat",
            openai_api_key=KEYS["OpenRouter"],
            openai_api_base="https://openrouter.ai/api/v1",
            temperature=0.3
        )
    return None

def get_embeddings():
    return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

NOT_FOUND_FLAG = "NOT_IN_CONTEXT"
rag_prompt_template = f"""Use the following pieces of context to answer the question at the end.
If the context does NOT contain enough information to answer the question,
respond with EXACTLY the phrase "{NOT_FOUND_FLAG}" and nothing else.

Context:
{{context}}

Question: {{question}}

Answer:"""

RAG_PROMPT = PromptTemplate(
    template=rag_prompt_template,
    input_variables=["context", "question"]
)

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"message": "AI Backend API is running"}

@app.get("/providers")
def get_available_providers():
    return [p for p, k in KEYS.items() if k]

@app.post("/process-knowledge")
async def process_knowledge(
    files: List[UploadFile] = File(None),
    url: Optional[str] = Form(None)
):
    global vector_db, doc_count
    all_data = []
    
    try:
        if files:
            for file in files:
                with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                    shutil.copyfileobj(file.file, tmp)
                    temp_path = tmp.name
                loader = PyPDFLoader(temp_path)
                all_data.extend(loader.load())
                os.remove(temp_path)
        
        if url:
            loader = WebBaseLoader(url)
            all_data.extend(loader.load())

        if not all_data:
            raise HTTPException(status_code=400, detail="No content to process")

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = text_splitter.split_documents(all_data)
        
        embeddings = get_embeddings()
        vector_db = FAISS.from_documents(chunks, embeddings)
        doc_count = len(chunks)
        
        return {"status": "success", "chunks_processed": doc_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(
    message: str = Form(...),
    provider: str = Form(...),
    mode: str = Form("Smart Hybrid (Docs + AI)")
):
    global vector_db
    
    try:
        llm = get_llm(provider)
        if not llm:
            raise HTTPException(status_code=400, detail="Invalid provider")
            
        response = None
        source = "General Knowledge"
        
        # Strategy 1: RAG
        if vector_db:
            qa_chain = RetrievalQA.from_chain_type(
                llm=llm,
                retriever=vector_db.as_retriever(search_kwargs={"k": 3}),
                return_source_documents=False,
                chain_type_kwargs={"prompt": RAG_PROMPT}
            )
            rag_response = qa_chain.invoke(message)["result"].strip()
            
            if NOT_FOUND_FLAG not in rag_response:
                response = rag_response
                source = "Knowledge Base"
        
        # Strategy 2: Fallback
        if response is None:
            if mode == "Knowledge Base Only":
                response = "I couldn't find the answer in your knowledge base."
            else:
                general_response = llm.invoke(f"Answer concisely.\n\nQuestion: {message}")
                response = general_response.content
                source = "General Knowledge"
        
        return {
            "response": response,
            "source": source
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/clear")
async def clear_knowledge():
    global vector_db, doc_count
    vector_db = None
    doc_count = 0
    return {"status": "cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)