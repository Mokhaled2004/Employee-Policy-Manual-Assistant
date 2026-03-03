import os
from langchain_chroma import Chroma
from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage, AIMessage
from dotenv import load_dotenv
from flashrank import Ranker, RerankRequest

load_dotenv()

# --- CONFIGURATION ---
USE_CLOUD = False 
LOCAL_OLLAMA_URL = "http://192.168.1.21:11434"
CLOUD_OLLAMA_URL = "https://ollama.com"
OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY")

# --- PATH SETUP ---
CORE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(os.path.dirname(CORE_DIR))
VECTOR_DB_DIR = os.path.join(BACKEND_DIR, "vector_db")

# 1. Setup Embeddings
embeddings = OllamaEmbeddings(model="nomic-embed-text:v1.5", base_url=LOCAL_OLLAMA_URL)
vector_db = Chroma(persist_directory=VECTOR_DB_DIR, embedding_function=embeddings)

# --- 2. MULTI-USER MEMORY STORE ---
sessions_db = {}

def get_session_history(session_id: str):
    if session_id not in sessions_db:
        sessions_db[session_id] = []
    return sessions_db[session_id]

# --- 3. TWO-STAGE RETRIEVAL WITH DE-DUPLICATION ---
ranker = Ranker()

def rerank_context(query: str):
    initial_docs = vector_db.as_retriever(
        search_type="mmr", 
        search_kwargs={"k": 15, "fetch_k": 30, "lambda_mult": 0.5}
    ).invoke(query)
    
    seen_content = set()
    unique_passages = []
    for i, doc in enumerate(initial_docs):
        clean_text = doc.page_content.strip().lower()
        if clean_text not in seen_content:
            seen_content.add(clean_text)
            unique_passages.append({
                "id": i, 
                "text": doc.page_content, 
                "metadata": doc.metadata
            })

    rerank_request = RerankRequest(query=query, passages=unique_passages)
    results = ranker.rerank(rerank_request)
    
    top_passages = [r['text'] for r in results[:3]]
    return "\n\n---\n\n".join(top_passages)

# --- 4. SENIOR AUDITOR PROMPT ---
# Added strict instructions for spacing and headers to fix the "large string" issue
prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a Senior HR Compliance Auditor. Your task is to provide firm, consistent, and policy-driven answers.

    STRICT FORMATTING RULES:
    1. Use '###' for Topic Headers.
    2. Use double line breaks between EVERY paragraph and section.
    3. Use bolding (**text**) for specific times, dates, or dollar amounts.
    4. Use '-' for bullet points.
    5. Use Markdown tables if comparing numbers or categories.
    
    AUDIT GUIDELINES:
    - Use ONLY the provided Context. 
    - Be decisive. State deviations as violations.
    - Always cite Section numbers.
    - If the context doesn't contain the answer, state that the policy is not defined in the current handbook.

    Context:
    {context}"""),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{question}"),
])

# --- 5. LLM SELECTION ---
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

# --- 6. LCEL CHAIN ---
rag_chain = (
    {
        "context": lambda x: rerank_context(x["question"]),
        "chat_history": lambda x: x["chat_history"],
        "question": lambda x: x["question"],
    }
    | prompt
    | llm
    | StrOutputParser()
)

def query_documents(user_question: str, session_id: str = "default"):
    history = get_session_history(session_id)
    try:
        answer = rag_chain.invoke({
            "question": user_question,
            "chat_history": history
        })
        
        history.append(HumanMessage(content=user_question))
        history.append(AIMessage(content=answer))
        
        if len(history) > 10:
            sessions_db[session_id] = history[-10:]
            
        return answer
    except Exception as e:
        return f"System Error: {str(e)}"