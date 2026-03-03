import React from "react";
import { ShieldCheck, RotateCcw, Activity } from "lucide-react";

const Header = ({ onReset }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 1. Brand & Status Section */}
        <div className="flex items-center gap-3 md:gap-4">
          <div className="relative flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-200 ring-1 ring-indigo-500/20">
            <ShieldCheck className="text-white" size={20} />
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex flex-col">
            <h1 className="text-xs font-black uppercase tracking-tight text-slate-900 md:text-base">
              Guardrail <span className="text-indigo-600">AI</span>
            </h1>
            <div className="flex items-center gap-1">
              <Activity size={10} className="text-emerald-500" />
              <span className="text-[9px] md:text-[10px] font-bold tracking-[0.1em] text-slate-400">
                AUDITOR LIVE
              </span>
            </div>
          </div>
        </div>

        {/* 2. Actions Section */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden h-6 w-px bg-slate-200 md:block mr-1"></div>

          <button
            onClick={onReset}
            className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-bold text-slate-600 shadow-sm transition-all hover:border-indigo-100 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95"
          >
            <RotateCcw
              size={14}
              className="transition-transform duration-500 group-hover:rotate-[-180deg]"
            />
            <span className="hidden sm:inline">New Analysis</span>
            <span className="sm:hidden">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
