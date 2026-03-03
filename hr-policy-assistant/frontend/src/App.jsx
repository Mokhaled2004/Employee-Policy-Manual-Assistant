import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

// Component Imports
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";
import Header from "./components/Header";

const App = () => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I am ready to analyze your HR documents. Please upload a handbook or ask a specific policy question.",
    },
  ]);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll logic
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isUploading]);

  const handleReset = async () => {
    try {
      await axios.post("http://localhost:8000/reset");
      setMessages([
        {
          role: "assistant",
          content:
            "Chat history cleared. How can I help you with a new inquiry?",
        },
      ]);
    } catch (err) {
      console.error("Reset failed:", err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await axios.post(
        "http://localhost:8000/upload",
        formData,
      );
      setMessages((p) => [
        ...p,
        {
          role: "assistant",
          content: `✅ Document ingested: ${response.data.message}`,
        },
      ]);
    } catch (err) {
      setMessages((p) => [
        ...p,
        { role: "assistant", content: "❌ Error uploading document." },
      ]);
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setMessages((p) => [...p, { role: "user", content: userMsg }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:8000/ask", {
        question: userMsg,
      });
      setMessages((p) => [
        ...p,
        { role: "assistant", content: response.data.answer },
      ]);
    } catch (err) {
      setMessages((p) => [
        ...p,
        { role: "assistant", content: "Backend Error: Connection refused." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    /* h-[100dvh] is vital for mobile to prevent the keyboard from pushing content off-screen */
    <div className="flex flex-col h-screen h-[100dvh] bg-[#FBFBFE] font-sans text-slate-900 overflow-hidden">
      <Header onReset={handleReset} />

      <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          isUploading={isUploading}
          scrollRef={scrollRef}
        />

        <ChatInput
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          handleFileUpload={handleFileUpload}
          fileInputRef={fileInputRef}
          isLoading={isLoading}
          isUploading={isUploading}
        />
      </main>
    </div>
  );
};

export default App;
