import streamlit as st
import os
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import PyPDFLoader, WebBaseLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA

# --- 1. Purpose & Documentation ---
# This bot allows users to "feed" knowledge via PDF or URL.
# It uses Google's Gemini Pro for answering and FAISS for local memory.

st.set_page_config(page_title="Gemini Knowledge Bot", page_icon="✦")
st.title("✦ Gemini Knowledge Assistant")

# Sidebar for Setup and Knowledge Feeding
with st.sidebar:
    st.header("Configuration")
    # Get the API Key from the user
    user_api_key = st.text_input("Gemini API Key", type="password", help="Get it from aistudio.google.com")
    
    st.divider()
    
    st.header("Feed Knowledge")
    uploaded_file = st.file_uploader("Upload a PDF document", type="pdf")
    url_input = st.text_input("Or input a Website URL")
    
    process_button = st.button("Initialize Knowledge Base")

# --- 2. Step-by-Step Logic ---

# Initialize vector database in session state so it persists across clicks
if "vector_db" not in st.session_state:
    st.session_state.vector_db = None

if process_button:
    if not user_api_key:
        st.error("Please provide a Gemini API Key!")
    else:
        # Set environment variable for the libraries to use
        os.environ["GOOGLE_API_KEY"] = user_api_key
        
        all_data = []
        
        # Step A: Load the Data
        try:
            if uploaded_file:
                with open("temp_knowledge.pdf", "wb") as f:
                    f.write(uploaded_file.getbuffer())
                loader = PyPDFLoader("temp_knowledge.pdf")
                all_data.extend(loader.load())
            
            if url_input:
                loader = WebBaseLoader(url_input)
                all_data.extend(loader.load())

            if all_data:
                # Step B: Split text into digestible chunks
                # 1000 characters is a good balance for context
                text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
                chunks = text_splitter.split_documents(all_data)
                
                # Step C: Create Embeddings and Store in FAISS
                # This converts text into numerical vectors Gemini can understand
                embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2-preview")
                st.session_state.vector_db = FAISS.from_documents(chunks, embeddings)
                
                st.success("Knowledge successfully processed!")
            else:
                st.warning("No data found. Please upload a file or URL.")
        except Exception as e:
            st.error(f"An error occurred during processing: {e}")

# --- 3. Simple UI Chat Interface ---

# Storage for the chat history (No long-term memory, just for the UI display)
if "chat_messages" not in st.session_state:
    st.session_state.chat_messages = []

# Display the message history
for message in st.session_state.chat_messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# User prompt
if prompt := st.chat_input("Ask a question based on your data..."):
    # Add user message to UI
    st.session_state.chat_messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # Step D: Generate Answer using RetrievalQA
    with st.chat_message("assistant"):
        if st.session_state.vector_db and user_api_key:
            # Initialize Gemini Model
            llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.3)
            
            # The chain takes the query, finds data in FAISS, and sends to Gemini
            qa_chain = RetrievalQA.from_chain_type(
                llm=llm,
                retriever=st.session_state.vector_db.as_retriever(),
                return_source_documents=False
            )
            
            response = qa_chain.invoke(prompt)["result"]
            st.markdown(response)
            st.session_state.chat_messages.append({"role": "assistant", "content": response})
        else:
            st.info("Please set your API key and feed knowledge in the sidebar to start.")