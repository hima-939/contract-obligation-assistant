"use client";

import { FileText } from "lucide-react";

interface ContractViewerProps {
  contractText: string;
}

export function ContractViewer({ contractText }: ContractViewerProps) {
  return (
    <section className="flex min-h-[32rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <FileText className="h-4 w-4 text-slate-500" />
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Contract text</h2>
      </div>
      {contractText.trim() ? (
        <pre className="flex-1 overflow-auto whitespace-pre-wrap p-4 font-mono text-sm leading-6 text-slate-700 dark:text-slate-300">
          {contractText}
        </pre>
      ) : (
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate-500">
          No contract text yet. Load a sample or paste a document to display the source here.
        </div>
      )}
    </section>
  );
}
