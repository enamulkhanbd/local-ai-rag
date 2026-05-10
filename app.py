import streamlit as st
import os
import tempfile
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

# --- 1. Load API Keys from .env ---
load_dotenv(override=True)
KEYS = {
    "Gemini": os.getenv("GOOGLE_API_KEY"),
    "OpenAI": os.getenv("OPENAI_API_KEY"),
    "Claude": os.getenv("ANTHROPIC_API_KEY"),
    "DeepSeek": os.getenv("DEEPSEEK_API_KEY"),
    "OpenRouter": os.getenv("OPENROUTER_API_KEY")
}

# --- 2. Page Setup ---
st.set_page_config(page_title="Multi-AI Assistant", page_icon="✦")
st.title("✦ Multi-AI Knowledge Assistant")

# --- 3. Sidebar Selection & Knowledge Feeding ---
with st.sidebar:
    st.header("1. Choose AI Provider")
    
    # Only show providers that have keys
    available_providers = [p for p, k in KEYS.items() if k]
    if not available_providers:
        st.error("No API keys found in .env! Please add at least one key.")
        st.stop()
        
    selected_provider = st.selectbox(
        "Select Provider",
        available_providers,
        help="Only providers with keys in .env are shown"
    )
    
    st.divider()
    
    st.header("2. Feed Knowledge")
    uploaded_files = st.file_uploader(
        "Upload PDF documents",
        type="pdf",
        accept_multiple_files=True
    )
    url_input = st.text_input("Or input a Website URL")
    
    process_button = st.button("Initialize Knowledge Base")
    
    # st.divider()
    # st.header("3. Settings")
    # response_mode = st.radio(
    #     "Response Mode",
    #     ["Smart Hybrid (Docs + AI)", "Knowledge Base Only"],
    #     help="Choose whether to search your documents with a fallback, or stay strictly within your knowledge base."
    # )
    response_mode = "Knowledge Base Only"
    
    if "vector_db" in st.session_state and st.session_state.vector_db:
        st.success(f"✅ Knowledge base loaded ({st.session_state.doc_count} chunks)")

# --- 4. Provider Factory ---
def get_llm(provider):
    if provider == "Gemini":
        return ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3)
    elif provider == "OpenAI":
        return ChatOpenAI(model="gpt-4o-mini", temperature=0.3)
    elif provider == "Claude":
        return ChatAnthropic(model="claude-3-5-sonnet-20240620", temperature=0.3)
    elif provider == "DeepSeek":
        # DeepSeek uses OpenAI-compatible API
        return ChatOpenAI(
            model="deepseek-chat",
            openai_api_key=KEYS["DeepSeek"],
            openai_api_base="https://api.deepseek.com/v1",
            temperature=0.3
        )
    elif provider == "OpenRouter":
        # OpenRouter uses OpenAI-compatible API
        return ChatOpenAI(
            model="deepseek/deepseek-chat", # Defaulting to DeepSeek on OpenRouter
            openai_api_key=KEYS["OpenRouter"],
            openai_api_base="https://openrouter.ai/api/v1",
            temperature=0.3
        )
    return None

# Use Local Embeddings (Option A) — Free and fast for all providers
@st.cache_resource
def get_embeddings():
    return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# --- 5. Knowledge Processing Logic ---

if "vector_db" not in st.session_state:
    st.session_state.vector_db = None
if "doc_count" not in st.session_state:
    st.session_state.doc_count = 0

if process_button:
    all_data = []
    try:
        if uploaded_files:
            for uploaded_file in uploaded_files:
                with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                    tmp.write(uploaded_file.getbuffer())
                    temp_path = tmp.name
                loader = PyPDFLoader(temp_path)
                all_data.extend(loader.load())
                os.remove(temp_path)
        
        if url_input:
            loader = WebBaseLoader(url_input)
            all_data.extend(loader.load())

        if all_data:
            with st.spinner("Processing documents into local vector database..."):
                text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
                chunks = text_splitter.split_documents(all_data)
                
                embeddings = get_embeddings()
                st.session_state.vector_db = FAISS.from_documents(chunks, embeddings)
                st.session_state.doc_count = len(chunks)
                st.success(f"✅ Knowledge base ready! Processed {len(chunks)} chunks.")
        else:
            st.warning("No data found. Please upload files or enter a URL.")
    except Exception as e:
        st.error(f"An error occurred during processing: {e}")

# --- 6. Custom RAG Prompt ---
NOT_FOUND_FLAG = "NOT_IN_CONTEXT"
rag_prompt_template = f"""Use the following pieces of context to answer the question at the end.
If the context does NOT contain enough information to answer the question,
respond with EXACTLY the phrase "{NOT_FOUND_FLAG}" and nothing else.
Do not try to make up an answer from the context if it's not relevant.

Context:
{{context}}

Question: {{question}}

Answer:"""

RAG_PROMPT = PromptTemplate(
    template=rag_prompt_template,
    input_variables=["context", "question"]
)

# --- 7. Chat Interface ---

if "chat_messages" not in st.session_state:
    st.session_state.chat_messages = []

for message in st.session_state.chat_messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

if prompt := st.chat_input(f"Ask {selected_provider} anything..."):
    st.session_state.chat_messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        try:
            llm = get_llm(selected_provider)
            response = None
            source_label = None
            
            # Strategy 1: Try RAG if knowledge base is loaded
            if st.session_state.vector_db:
                qa_chain = RetrievalQA.from_chain_type(
                    llm=llm,
                    retriever=st.session_state.vector_db.as_retriever(search_kwargs={"k": 3}),
                    return_source_documents=False,
                    chain_type_kwargs={"prompt": RAG_PROMPT}
                )
                rag_response = qa_chain.invoke(prompt)["result"].strip()
                
                if NOT_FOUND_FLAG not in rag_response:
                    response = rag_response
                    source_label = f"📄 *Answered by {selected_provider} from your loaded documents*"
                elif response_mode == "Knowledge Base Only":
                    response = "I couldn't find the answer in your knowledge base, and 'Knowledge Base Only' mode is active."
                    source_label = "📄 *Search attempted in knowledge base only*"
            
            # Strategy 2: Fallback to general knowledge if mode allows it
            if response is None and response_mode != "Knowledge Base Only":
                general_response = llm.invoke(
                    f"Answer the following question using your general knowledge. "
                    f"Be helpful, accurate, and concise.\n\nQuestion: {prompt}"
                )
                response = general_response.content
                if st.session_state.vector_db:
                    source_label = f"🌐 *Answered by {selected_provider}'s general knowledge*"
                else:
                    source_label = f"🌐 *Answered by {selected_provider}'s general knowledge*"
            
            # Handle cases where no response was generated
            if response is None:
                response = "I couldn't find an answer in your knowledge base. If you want a general answer, please switch to 'Smart Hybrid' mode."

            st.markdown(response)
            if source_label:
                st.caption(source_label)
            st.session_state.chat_messages.append({"role": "assistant", "content": response})
            
        except Exception as e:
            st.error(f"Error generating response from {selected_provider}: {e}")