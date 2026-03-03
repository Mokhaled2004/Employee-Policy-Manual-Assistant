import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, ShieldCheck, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TypewriterText from "./TypewriterText";

const MessageList = ({ messages, isLoading, isUploading, scrollRef }) => {
  // Helper to highlight citations in the text
  const formatCitations = (content, isUser) => {
    // UPDATED: Added 'i' flag for case-insensitive matching to handle [Source:], [SOURCE:], etc.
    const citationRegex = /\[SOURCE:\s*(.*?)\s*\|\s*PAGE:\s*(.*?)\]/gi;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = citationRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      const [_, source, page] = match;

      parts.push(
        <span
          key={match.index}
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 mx-0.5 rounded-md border font-bold text-[10px] md:text-[11px] shadow-sm align-middle transition-transform hover:scale-105 cursor-default
            ${
              isUser
                ? "bg-emerald-400/20 border-emerald-300/30 text-emerald-50"
                : "bg-emerald-50/60 border-emerald-200/50 text-emerald-800"
            }`}
        >
          <FileText
            size={12}
            className={isUser ? "text-emerald-200" : "text-emerald-500"}
          />
          <span className="opacity-60 uppercase tracking-tighter text-[9px]">
            Src:
          </span>
          <span className="truncate max-w-[120px]">{source}</span>
          <span
            className={`w-px h-3 mx-0.5 ${isUser ? "bg-emerald-300/30" : "bg-emerald-200"}`}
          />
          <span className="opacity-60 uppercase tracking-tighter text-[9px]">
            Pg:
          </span>
          {page}
        </span>,
      );
      lastIndex = citationRegex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }
    return parts.length > 0 ? parts : content;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-12 bg-[#FBFBFE]">
      <div className="max-w-3xl mx-auto">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`flex mb-6 md:mb-10 ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex flex-col gap-1.5 max-w-[90%] md:max-w-[80%] ${isUser ? "items-end" : "items-start"}`}
                >
                  <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    {isUser ? "User Inquiry" : "Policy Auditor"}
                  </span>

                  <div
                    className={`flex gap-2 md:gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border transition-all ${
                        isUser
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "bg-white border-slate-200 text-indigo-600"
                      }`}
                    >
                      {isUser ? <User size={16} /> : <ShieldCheck size={16} />}
                    </div>

                    <div
                      className={`rounded-[20px] md:rounded-[24px] px-4 py-3 md:px-6 md:py-4 text-[14px] md:text-[15px] leading-relaxed shadow-sm transition-all ${
                        isUser
                          ? "bg-indigo-600 text-white rounded-tr-none shadow-indigo-100 shadow-lg"
                          : "bg-white border border-slate-100 text-slate-700 rounded-tl-none shadow-md shadow-slate-200/40"
                      }`}
                    >
                      {msg.role === "assistant" &&
                      idx === messages.length - 1 &&
                      idx !== 0 ? (
                        <TypewriterText text={msg.content} />
                      ) : (
                        <div
                          className={`prose prose-sm md:prose-base max-w-none prose-headings:font-bold ${
                            isUser
                              ? "prose-invert text-white"
                              : "prose-slate text-slate-700"
                          }`}
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ node, children, ...props }) => (
                                <p
                                  className="whitespace-pre-wrap mb-3 last:mb-0"
                                  {...props}
                                >
                                  {React.Children.map(children, (child) =>
                                    typeof child === "string"
                                      ? formatCitations(child, isUser)
                                      : child,
                                  )}
                                </p>
                              ),
                              strong: ({ node, ...props }) => (
                                <strong
                                  className={`font-extrabold ${isUser ? "text-white" : "text-indigo-900"}`}
                                  {...props}
                                />
                              ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Loading Indicator */}
        {(isLoading || isUploading) && (
          <div className="flex justify-start ml-12 py-4">
            <div className="flex gap-2 items-center bg-white border border-slate-100 rounded-full px-4 py-2 shadow-sm">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
                {isUploading ? "Uploading..." : "Auditing..."}
              </span>
            </div>
          </div>
        )}
        <div ref={scrollRef} className="h-8" />
      </div>
    </div>
  );
};

export default MessageList;
