import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText } from "lucide-react";

const TypewriterText = ({ text, speed = 10 }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(timer);
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  const formatCitations = (content) => {
    // UPDATED: Added 'i' flag for case-insensitive matching
    // This catches [Source:], [SOURCE:], , etc.
    const citationRegex = /\*?\[SOURCE:\s*(.*?)\s*\|\s*PAGE:\s*(.*?)\]\*?/gi;
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
          className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-0.5 rounded-md bg-emerald-50/60 border border-emerald-200/50 text-emerald-800 font-bold text-[10px] md:text-[11px] shadow-sm align-middle"
        >
          <FileText size={12} className="text-emerald-500" />
          <span className="opacity-60 uppercase tracking-tighter text-[9px]">
            Src:
          </span>
          <span className="truncate max-w-[120px]">{source}</span>
          <span className="w-px h-3 bg-emerald-200 mx-0.5" />
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
    <div className="prose prose-slate max-w-none prose-sm md:prose-base prose-p:mb-3 prose-p:leading-relaxed prose-headings:text-indigo-900 prose-headings:font-bold prose-li:my-1 text-slate-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ node, children, ...props }) => (
            <p className="whitespace-pre-wrap mb-3 last:mb-0" {...props}>
              {/* This map ensures we check every bit of text the AI sends */}
              {React.Children.map(children, (child) =>
                typeof child === "string" ? formatCitations(child) : child,
              )}
            </p>
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-extrabold text-indigo-900" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-slate-200 shadow-sm">
              <table
                className="min-w-full divide-y divide-slate-200 bg-slate-50/30"
                {...props}
              />
            </div>
          ),
        }}
      >
        {displayedText}
      </ReactMarkdown>
    </div>
  );
};

export default TypewriterText;
