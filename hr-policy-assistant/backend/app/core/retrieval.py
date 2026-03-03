import os
import re
from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from flashrank import Ranker, RerankRequest

from app.core.prompts import CHAT_PROMPT
from app.core.guardrails import SemanticGuardrail

load_dotenv()

# --- CONFIGURATION ---
USE_CLOUD = os.getenv("USE_CLOUD", "True") == "True"
LOCAL_OLLAMA_URL = "http://192.168.1.21:11434"
CLOUD_OLLAMA_URL = "https://ollama.com"
OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY")

# --- PATH SETUP ---
CORE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(os.path.dirname(CORE_DIR))
VECTOR_DB_DIR = os.path.join(BACKEND_DIR, "vector_db")

# 1. Setup Models
embeddings = OllamaEmbeddings(model="nomic-embed-text:v1.5", base_url=LOCAL_OLLAMA_URL)
vector_db = Chroma(persist_directory=VECTOR_DB_DIR, embedding_function=embeddings)
guardrail = SemanticGuardrail(embeddings)
ranker = Ranker()

# LLM Selection
if USE_CLOUD:
    llm = ChatOllama(
        model="gpt-oss:20b-cloud", 
        base_url=CLOUD_OLLAMA_URL,
        client_kwargs={"headers": {"Authorization": f"Bearer {OLLAMA_API_KEY}"}},
        temperature=0
    )
else:
    llm = ChatOllama(
        model="llama3.2:latest", 
        base_url=LOCAL_OLLAMA_URL,
        temperature=0,
    )

# --- 2. QUERY REWRITER (The Memory "Bridge") ---
# This chain converts vague follow-ups into specific search terms
rewrite_system_prompt = """Given a chat history and the latest user question which might reference context in the chat history, 
formulate a standalone question which can be understood without the chat history. 
Do NOT answer the question, just reformulate it if needed and otherwise return it as is."""

rewrite_prompt = ChatPromptTemplate.from_messages([
    ("system", rewrite_system_prompt),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{question}"),
])

rewriter_chain = rewrite_prompt | llm | StrOutputParser()

# --- 3. MEMORY ---
sessions_db = {}

def get_session_history(session_id: str):
    if session_id not in sessions_db:
        sessions_db[session_id] = []
    return sessions_db[session_id]

# --- 4. OPTIMIZED RETRIEVAL & GUARDRAIL ---
def process_context(input_data):
    original_query = input_data["question"]
    history = input_data.get("chat_history", [])
    
    # Quick Guardrail Check
    if guardrail.is_out_of_scope(original_query):
        return "GUARDRAIL_TRIGGERED"

    # CONTEXTUAL REWRITE: Handle "it", "that", "the first one", etc.
    search_query = original_query
    if history:
        try:
            search_query = rewriter_chain.invoke({
                "question": original_query, 
                "chat_history": history
            })
            # Clean up the rewritten query to ensure no weird formatting
            search_query = search_query.strip().strip('"')
        except Exception as e:
            print(f"⚠️ Rewriting failed: {e}")
            search_query = original_query

    # MMR Retrieval using the rewritten search_query
    initial_docs = vector_db.as_retriever(
        search_type="mmr", 
        search_kwargs={"k": 12, "fetch_k": 25}
    ).invoke(search_query)
    
    # Deduplication
    seen = set()
    unique_passages = []
    for i, doc in enumerate(initial_docs):
        text = doc.page_content.strip()
        if text.lower() not in seen:
            seen.add(text.lower())
            unique_passages.append({"id": i, "text": text, "metadata": doc.metadata})

    if not unique_passages:
        return ""

    # Reranking using rewritten search_query
    rerank_request = RerankRequest(query=search_query, passages=unique_passages)
    results = ranker.rerank(rerank_request)
    
    # Formatting Citations
    formatted_passages = []
    for r in results[:3]:
        meta = r.get('metadata', {})
        source = meta.get('source', 'Unknown Document')
        page = meta.get('page', 'N/A')
        
        block = (
            f"[[ BEGIN SOURCE: {source} | PAGE: {page} ]]\n"
            f"{r['text']}\n"
            f"[[ END SOURCE: {source} ]]"
        )
        formatted_passages.append(block)
    
    return "\n\n---\n\n".join(formatted_passages)

# --- 5. CHAIN ORCHESTRATION ---
def route_output(input_data):
    if input_data["context"] == "GUARDRAIL_TRIGGERED":
        return "I am an HR Audit Assistant. I am restricted to answering policy and compliance-related questions."
    
    if not input_data["context"]:
        return "I'm sorry, the current HR handbook does not contain information to answer that specific question."

    return core_llm_chain.invoke(input_data)

core_llm_chain = CHAT_PROMPT | llm | StrOutputParser()

rag_chain = (
    RunnablePassthrough.assign(context=process_context)
    | RunnableLambda(route_output)
)

# --- 6. MAIN INTERFACE ---
def query_documents(user_question: str, session_id: str = "default"):
    history = get_session_history(session_id)
    try:
        # Pass the history explicitly so process_context can use it for rewriting
        answer = rag_chain.invoke({
            "question": user_question,
            "chat_history": history
        })
        
        # History management (keep last 10 exchanges)
        history.append(HumanMessage(content=user_question))
        history.append(AIMessage(content=answer))
        sessions_db[session_id] = history[-10:] 
            
        return answer
    except Exception as e:
        return f"System Error: {str(e)}"