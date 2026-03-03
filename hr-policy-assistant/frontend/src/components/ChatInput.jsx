import React from "react";
import { Paperclip, Send, Loader2 } from "lucide-react";

const ChatInput = ({
  input = "",
  setInput,
  handleSend,
  handleFileUpload,
  fileInputRef,
  isLoading,
  isUploading,
}) => {
  return (
    <div className="p-3 md:p-8 bg-gradient-to-t from-[#FBFBFE] via-[#FBFBFE] to-transparent">
      <div className="max-w-4xl mx-auto bg-white rounded-[22px] md:rounded-3xl p-1.5 md:p-2 shadow-xl shadow-indigo-100/50 border border-slate-200/60 flex items-center gap-1 md:gap-2 group focus-within:ring-4 ring-indigo-500/10 transition-all">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf"
          className="hidden"
        />

        {/* Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          disabled={isUploading || isLoading}
          className="p-3 md:p-4 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-[18px] md:rounded-2xl transition-all disabled:opacity-50 flex-shrink-0"
          title="Upload Handbook"
        >
          {isUploading ? (
            <Loader2 size={20} className="animate-spin text-indigo-600" />
          ) : (
            <Paperclip size={20} className="md:size-[22px]" />
          )}
        </button>

        {/* Input Form */}
        <form
          onSubmit={handleSend}
          className="flex-1 flex items-center min-w-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isUploading ? "Uploading..." : "Ask a policy question..."
            }
            // text-base (16px) is mandatory for mobile to prevent auto-zoom
            className="flex-1 bg-transparent border-none py-3 md:py-4 text-slate-700 placeholder:text-slate-400 outline-none px-1 md:px-2 font-medium text-base md:text-[15px] min-w-0"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isUploading || !(input || "").trim()}
            className="bg-indigo-600 text-white p-3 md:px-5 md:py-4 rounded-[18px] md:rounded-2xl hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-indigo-200 flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <Send size={18} />
                <span className="hidden sm:inline font-bold text-sm pr-1">
                  Analyze
                </span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer System Text */}
      <p className="text-center text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] mt-3 md:mt-4">
        AI-Powered Policy Verification System
      </p>
    </div>
  );
};

export default ChatInput;
