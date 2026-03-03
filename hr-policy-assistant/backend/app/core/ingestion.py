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

print(f"📍 Checking Data Folder: {DATA_FOLDER}")
print(f"📍 Target DB Folder: {VECTOR_DB_DIR}")

# --- EMBEDDINGS ---
embeddings = OllamaEmbeddings(
    model="nomic-embed-text:v1.5",
    base_url="http://192.168.1.21:11434"
)

def is_noise(text):
    """Filters out Table of Contents noise based on dot density."""
    if not text.strip(): return True
    dot_count = text.count('.')
    # If more than 15% of the string is dots, it's likely a TOC line
    if (dot_count / len(text)) > 0.15: return True
    # If string is short but contains dot leaders (e.g. "Section 1.......5")
    if len(text) < 100 and re.search(r'\.{3,}', text): return True
    return False

def process_document(file_path: str): 
    # 1. Load Document
    loader = PyMuPDFLoader(file_path) if file_path.endswith('pdf') else Docx2txtLoader(file_path)
    documents = loader.load()
    
    # Extract filename for metadata
    filename = os.path.basename(file_path)

    # 2. Split into Chunks
    # Using slightly more robust separators for policy documents
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, 
        chunk_overlap=200,
        separators=["\n\n", "\n", ".", " ", ""]
    )
    
    initial_chunks = text_splitter.split_documents(documents)
    
    # 3. Clean and Filter + Add Metadata
    final_chunks = []
    for c in initial_chunks:
        if not is_noise(c.page_content):
            # Add source metadata so the model can cite the document
            c.metadata["source"] = filename
            c.metadata["doc_id"] = str(uuid.uuid4())
            final_chunks.append(c)
    
    print(f"📉 Filtered: {len(initial_chunks) - len(final_chunks)} noise chunks.")

    # 4. Persistence Logic
    vector_db = Chroma(
        persist_directory=VECTOR_DB_DIR,
        embedding_function=embeddings
    )
    
    # ADDED: Basic deduplication check
    # Check if this filename is already in the metadata to prevent double-indexing
    existing_docs = vector_db.get(where={"source": filename})
    if existing_docs and len(existing_docs['ids']) > 0:
        return f"⚠️ Skipping: '{filename}' is already indexed."

    vector_db.add_documents(documents=final_chunks)

    return f"✅ SUCCESS: {len(final_chunks)} chunks stored in {VECTOR_DB_DIR} from {filename}"

if __name__ == "__main__":
    # Create folder if it doesn't exist for local testing
    os.makedirs(DATA_FOLDER, exist_ok=True)
    
    if os.path.exists(DATA_FOLDER):
        files = [f for f in os.listdir(DATA_FOLDER) if f.endswith((".pdf", ".docx"))]
        if files:
            file_path = os.path.join(DATA_FOLDER, files[0])
            print(f"🚀 Processing first file found: {file_path}")
            print(process_document(file_path))
        else:
            print(f"❌ No PDF or DOCX found in: {DATA_FOLDER}")
    else:
        print(f"❌ Folder not found: {DATA_FOLDER}")