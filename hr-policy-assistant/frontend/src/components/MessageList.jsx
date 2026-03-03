import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, ShieldCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TypewriterText from "./TypewriterText";

const MessageList = ({ messages, isLoading, isUploading, scrollRef }) => {
  return (
    /* flex-1 and overflow-y-auto ensures the middle section scrolls while header/input stay fixed */
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
                {/* Max-width 90% on mobile ensures bubbles don't touch screen edges */}
                <div
                  className={`flex flex-col gap-1.5 max-w-[90%] md:max-w-[80%] ${
                    isUser ? "items-end" : "items-start"
                  }`}
                >
                  <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    {isUser ? "User Inquiry" : "Policy Auditor"}
                  </span>

                  <div
                    className={`flex gap-2 md:gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                  >
                    {/* Avatar Icon */}
                    <div
                      className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border transition-all ${
                        isUser
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "bg-white border-slate-200 text-indigo-600"
                      }`}
                    >
                      {isUser ? (
                        <User size={16} className="md:size-[18px]" />
                      ) : (
                        <ShieldCheck size={16} className="md:size-[18px]" />
                      )}
                    </div>

                    {/* Message Bubble */}
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
                          className="prose prose-slate max-w-none prose-sm md:prose-base 
                                        prose-p:mb-3 prose-p:leading-relaxed 
                                        prose-headings:text-indigo-900 prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
                                        prose-ul:list-disc prose-ul:ml-5 prose-ul:mb-4
                                        prose-li:my-1"
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ node, ...props }) => (
                                <p
                                  className="whitespace-pre-wrap mb-3 last:mb-0"
                                  {...props}
                                />
                              ),
                              strong: ({ node, ...props }) => (
                                <strong
                                  className="font-extrabold text-indigo-900"
                                  {...props}
                                />
                              ),
                              table: ({ node, ...props }) => (
                                <div className="overflow-x-auto my-4 rounded-lg border border-slate-200 shadow-sm">
                                  <table
                                    className="min-w-full divide-y divide-slate-200 bg-slate-50/30"
                                    {...props}
                                  />
                                </div>
                              ),
                              th: ({ node, ...props }) => (
                                <th
                                  className="px-3 py-2 bg-slate-100 text-xs font-bold uppercase text-slate-600 text-left"
                                  {...props}
                                />
                              ),
                              td: ({ node, ...props }) => (
                                <td
                                  className="px-3 py-2 text-sm border-t border-slate-200 bg-white"
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start ml-10 md:ml-12"
          >
            <div className="flex gap-3 md:gap-4 items-center bg-white border border-slate-100 rounded-[18px] px-4 py-2 shadow-md">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
                {isUploading ? "Processing..." : "Analyzing..."}
              </span>
            </div>
          </motion.div>
        )}
        <div ref={scrollRef} className="h-8" />
      </div>
    </div>
  );
};

export default MessageList;
