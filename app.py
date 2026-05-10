import streamlit as st
import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import PyPDFLoader, WebBaseLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

# --- 1. Load API Key from .env ---
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# --- 2. Page Setup ---
st.set_page_config(page_title="Gemini Knowledge Bot", page_icon="✦")
st.title("✦ Personal Assistant")

# Sidebar for Knowledge Feeding only
with st.sidebar:
    st.header("Feed Knowledge")
    uploaded_files = st.file_uploader(
        "Upload PDF documents",
        type="pdf",
        accept_multiple_files=True,
        help="You can select multiple PDFs at once"
    )
    url_input = st.text_input("Or input a Website URL")
    
    process_button = st.button("Initialize Knowledge Base")
    
    # Show knowledge base status
    if "vector_db" in st.session_state and st.session_state.vector_db:
        st.success(f"✅ Knowledge base loaded ({st.session_state.doc_count} chunks)")

# --- 3. Knowledge Processing Logic ---

if "vector_db" not in st.session_state:
    st.session_state.vector_db = None
if "doc_count" not in st.session_state:
    st.session_state.doc_count = 0

if process_button:
    if not GOOGLE_API_KEY:
        st.error("API key not found! Please add GOOGLE_API_KEY to your .env file.")
    else:
        all_data = []
        
        try:
            # Load all uploaded PDFs
            if uploaded_files:
                import tempfile
                for uploaded_file in uploaded_files:
                    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                        tmp.write(uploaded_file.getbuffer())
                        temp_path = tmp.name
                    loader = PyPDFLoader(temp_path)
                    all_data.extend(loader.load())
                    os.remove(temp_path)  # Clean up temp file
            
            # Load URL
            if url_input:
                loader = WebBaseLoader(url_input)
                all_data.extend(loader.load())

            if all_data:
                text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
                chunks = text_splitter.split_documents(all_data)
                
                embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2-preview")
                st.session_state.vector_db = FAISS.from_documents(chunks, embeddings)
                st.session_state.doc_count = len(chunks)
                
                st.success(f"✅ Knowledge base ready! Processed {len(uploaded_files or [])} file(s), {len(chunks)} chunks.")
            else:
                st.warning("No data found. Please upload files or enter a URL.")
        except Exception as e:
            st.error(f"An error occurred during processing: {e}")

# --- 4. Custom RAG Prompt ---
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

# --- 5. Chat Interface ---

if "chat_messages" not in st.session_state:
    st.session_state.chat_messages = []

for message in st.session_state.chat_messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

if prompt := st.chat_input("Ask me anything..."):
    st.session_state.chat_messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        if not GOOGLE_API_KEY:
            st.error("API key not found! Please add GOOGLE_API_KEY to your .env file.")
        else:
            try:
                llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3)
                
                response = None
                source_label = None
                
                # Strategy 1: Try RAG if knowledge base is loaded
                if st.session_state.vector_db:
                    qa_chain = RetrievalQA.from_chain_type(
                        llm=llm,
                        retriever=st.session_state.vector_db.as_retriever(
                            search_kwargs={"k": 3}
                        ),
                        return_source_documents=False,
                        chain_type_kwargs={"prompt": RAG_PROMPT}
                    )
                    rag_response = qa_chain.invoke(prompt)["result"].strip()
                    
                    if NOT_FOUND_FLAG not in rag_response:
                        response = rag_response
                        source_label = "📄 *Answered from your loaded knowledge base*"
                
                # Strategy 2: Fallback to Gemini's general knowledge
                if response is None:
                    general_response = llm.invoke(
                        f"Answer the following question using your general knowledge. "
                        f"Be helpful, accurate, and concise.\n\nQuestion: {prompt}"
                    )
                    response = general_response.content
                    if st.session_state.vector_db:
                        source_label = "🌐 *Not found in your documents — answered from Gemini's general knowledge*"
                    else:
                        source_label = "🌐 *Answered from Gemini's general knowledge*"
                
                st.markdown(response)
                if source_label:
                    st.caption(source_label)
                st.session_state.chat_messages.append({"role": "assistant", "content": response})
                
            except Exception as e:
                st.error(f"Error generating response: {e}")