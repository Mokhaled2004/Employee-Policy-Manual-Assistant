# HR Policy Assistant

An AI-powered HR policy assistant that uses RAG (Retrieval-Augmented Generation) to answer questions about employee handbooks and policy documents. Built with FastAPI, LangChain, ChromaDB, and React.

## Features

- 📄 PDF document upload and processing
- 🤖 AI-powered question answering using Google Gemini
- 💾 Vector database storage with ChromaDB
- 🔍 Semantic search and retrieval
- 🛡️ Guardrails for out-of-scope queries
- 💬 Chat history and context management
- 🎨 Modern React UI with Tailwind CSS

## Tech Stack

**Backend:**
- FastAPI
- LangChain (with Google Gemini integration)
- ChromaDB (vector database)
- PyMuPDF & PDFPlumber (document parsing)
- Sentence Transformers (embeddings)

**Frontend:**
- React 19
- Vite
- Tailwind CSS
- Axios
- Framer Motion

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+** (for backend)
- **Node.js 16+** and **npm** (for frontend)
- **Google API Key** (for Gemini AI model)

---

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Create Virtual Environment

**On Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**On macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the `backend/app/` directory:

```bash
# Navigate to app directory
cd app

# Create .env file (or copy the example below)
```

**Example `.env` file:**

```env

# Ollama Cloud API Key (Optional - if using Ollama)
OLLAMA_API_KEY=your_ollama_api_key_here

# Database Configuration
CHROMA_DB_PATH=../vector_db
```

**How to get your Ollama Cloud API Key:**
1. Sign in to your account on the official Ollama Cloud portal.
2. Navigate to the Manage tab in your dashboard.
3. Click on Generate API Key.
4. Copy the key and paste it into your .env file as OLLAMA_API_KEY.
5. Browse the Ollama Library to find the specific Model Name you wish to use (e.g., gpt-oss:20b-cloud) and update your configuration accordingly.

### 5. Run the Backend Server

From the `backend/app/` directory:

```bash
python -m app.main 
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at: `http://localhost:8000`


---

## Frontend Setup

### 1. Navigate to Frontend Directory

Open a new terminal window and navigate to the frontend:

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Development Server

```bash
npm run dev
```

The frontend will be available at: `http://localhost:5173`

---

## Usage

### 1. Start Both Servers

Make sure both backend and frontend servers are running:

- **Backend:** `http://localhost:8000`
- **Frontend:** `http://localhost:5173`

### 2. Upload a Document

1. Open the frontend in your browser
2. Click the upload button (📎 icon)
3. Select a PDF file (e.g., employee handbook)
4. Wait for the document to be processed and indexed

### 3. Ask Questions

Type your HR policy questions in the chat input, such as:
- "What is the vacation policy?"
- "How many sick days do employees get?"
- "What is the dress code policy?"

### 4. Reset Chat History

Click the "Reset" button in the header to clear the conversation history.

---

## API Endpoints

### POST `/upload`
Upload and index a PDF document.

**Request:** Multipart form data with PDF file

**Response:**
```json
{
  "message": "File 'handbook.pdf' indexed.",
  "details": "..."
}
```

### POST `/ask`
Ask a question about the uploaded documents.

**Request:**
```json
{
  "question": "What is the vacation policy?"
}
```

**Response:**
```json
{
  "answer": "According to the employee handbook..."
}
```

### POST `/reset`
Clear the chat history.

**Response:**
```json
{
  "message": "Chat history cleared successfully."
}
```

---

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── guardrails.py      # Semantic guardrails
│   │   │   ├── ingestion.py       # Document processing
│   │   │   ├── prompts.py         # LLM prompts
│   │   │   └── retrieval.py       # RAG query logic
│   │   ├── data/                  # Uploaded PDFs
│   │   ├── .env                   # Environment variables
│   │   └── main.py                # FastAPI application
│   ├── vector_db/                 # ChromaDB storage
│   └── requirements.txt           # Python dependencies
│
└── frontend/
    ├── src/
    │   ├── components/            # React components
    │   ├── App.jsx                # Main application
    │   └── main.jsx               # Entry point
    ├── package.json               # Node dependencies
    └── vite.config.js             # Vite configuration
```

---

## Troubleshooting

### Backend Issues

**Error: "ModuleNotFoundError"**
- Make sure your virtual environment is activated
- Run `pip install -r requirements.txt` again

**Error: "GOOGLE_API_KEY not found"**
- Check that your `.env` file is in the `backend/app/` directory
- Verify the API key is correct and not expired

**Error: "Connection refused"**
- Ensure the backend server is running on port 8000
- Check for port conflicts with other applications

### Frontend Issues

**Error: "Cannot connect to backend"**
- Verify the backend is running at `http://localhost:8000`
- Check the API URL in `App.jsx` matches your backend URL

**Error: "npm install fails"**
- Try deleting `node_modules` and `package-lock.json`
- Run `npm install` again
- Ensure you have Node.js 16+ installed

---

## Development

### Backend Development

To run tests:
```bash
cd backend
python test_db.py
python test_retriever.py
```

### Frontend Development

Build for production:
```bash
cd frontend
npm run build
```

Preview production build:
```bash
npm run preview
```

---

## License

This project is for educational purposes.

---

## Support

For issues or questions, please check:
- Backend API docs: `http://localhost:8000/docs`
- LangChain documentation: https://python.langchain.com/
- FastAPI documentation: https://fastapi.tiangolo.com/
