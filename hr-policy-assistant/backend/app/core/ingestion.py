import os
import shutil
import re
import uuid
from langchain_ollama import OllamaEmbeddings 
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyMuPDFLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from dotenv import load_dotenv

load_dotenv()

# --- STANDARDIZED PATH SETUP ---
CORE_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.dirname(CORE_DIR)
BACKEND_DIR = os.path.dirname(APP_DIR)

VECTOR_DB_DIR = os.path.join(BACKEND_DIR, "vector_db")
DATA_FOLDER = os.path.join(APP_DIR, "data")

# --- EMBEDDINGS ---
embeddings = OllamaEmbeddings(
    model="nomic-embed-text:v1.5",
    base_url="http://192.168.1.21:11434"
)

def is_noise(text):
    if not text.strip(): return True
    dot_count = text.count('.')
    if (dot_count / len(text)) > 0.15: return True
    if len(text) < 100 and re.search(r'\.{3,}', text): return True
    return False

def process_document(file_path: str): 
    # 1. Load Document
    # PyMuPDF is great for metadata; Docx2txt is standard for Word
    loader = PyMuPDFLoader(file_path) if file_path.endswith('pdf') else Docx2txtLoader(file_path)
    documents = loader.load()
    
    filename = os.path.basename(file_path)

    # 2. Split into Chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, 
        chunk_overlap=200,
        separators=["\n\n", "\n", ".", " ", ""]
    )
    
    initial_chunks = text_splitter.split_documents(documents)
    
    # --- 3. Clean and Filter + Enhanced Metadata ---
    final_chunks = []
    for c in initial_chunks:
        if not is_noise(c.page_content):
            # Capture Source Filename
            c.metadata["source"] = filename
            
            # Capture Page Number (PDFs have 'page', Docx usually doesn't)
            # We default to 1 if it's a single-stream doc like Word
            page_val = c.metadata.get("page", 0) + 1
            c.metadata["page"] = page_val
            
            # Unique ID for deduplication and tracking
            c.metadata["doc_id"] = str(uuid.uuid4())
            
            final_chunks.append(c)
    
    print(f"📉 Filtered: {len(initial_chunks) - len(final_chunks)} noise chunks.")

    # 4. Persistence Logic
    vector_db = Chroma(
        persist_directory=VECTOR_DB_DIR,
        embedding_function=embeddings
    )
    
    # Basic deduplication check (Case-insensitive for safety)
    existing_docs = vector_db.get(where={"source": filename})
    if existing_docs and len(existing_docs['ids']) > 0:
        return f"⚠️ Skipping: '{filename}' is already indexed in the Audit DB."

    # Final storage
    vector_db.add_documents(documents=final_chunks)

    return f"✅ SUCCESS: {len(final_chunks)} chunks stored from {filename}"

if __name__ == "__main__":
    os.makedirs(DATA_FOLDER, exist_ok=True)
    if os.path.exists(DATA_FOLDER):
        files = [f for f in os.listdir(DATA_FOLDER) if f.endswith((".pdf", ".docx"))]
        if files:
            # Process all files in the folder for a complete audit
            for file in files:
                print(process_document(os.path.join(DATA_FOLDER, file)))
        else:
            print(f"❌ No PDF or DOCX found in: {DATA_FOLDER}")