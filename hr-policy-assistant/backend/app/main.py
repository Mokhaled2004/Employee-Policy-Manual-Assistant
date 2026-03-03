import os
import sys
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure the parent directory is in sys.path so app.core can be found
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# IMPORT: We now need to import 'clear_history' if you choose to export it, 
# or we can just access it via the core retrieval module.
from app.core.retrieval import query_documents

app = FastAPI(title="HR Policy Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Robust pathing: Points to backend/app/data
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

class ChatRequest(BaseModel):
    question: str

@app.post('/upload')
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    file_path = os.path.join(DATA_DIR, file.filename)
    
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Process and index
        from app.core.ingestion import process_document 
        status = process_document(file_path)
        return {"message": f"File '{file.filename}' indexed.", "details": status}
    except Exception as e:
        print(f"UPLOAD ERROR: {e}") 
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/ask')
def ask_hr(request: ChatRequest):
    try:
        # This now uses the 'chat_history' state in retrieval.py
        answer = query_documents(request.question)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# NEW: Endpoint to clear memory (Running State)
@app.post('/reset')
def reset_chat():
    try:
        # We reach into the retrieval module to clear the global list
        from app.core import retrieval
        retrieval.chat_history = []
        return {"message": "Chat history cleared successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)