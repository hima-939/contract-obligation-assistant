"use client";

import { FileStack, Loader2, Sparkles } from "lucide-react";

interface InputFormProps {
  contractText: string;
  policyText: string;
  isExtracting: boolean;
  onContractTextChange: (value: string) => void;
  onPolicyTextChange: (value: string) => void;
  onLoadSample: () => void;
  onSubmit: () => void;
}

export function InputForm({
  contractText,
  policyText,
  isExtracting,
  onContractTextChange,
  onPolicyTextChange,
  onLoadSample,
  onSubmit,
}: InputFormProps) {
  return (
    <form
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Source inputs</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Paste contract language and an optional internal playbook. This tool does not interpret legal rights.
          </p>
        </div>
        <button
          type="button"
          onClick={onLoadSample}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          <FileStack className="h-4 w-4" />
          Load Sample Contract
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Contract Text</span>
          <textarea
            value={contractText}
            onChange={(event) => onContractTextChange(event.target.value)}
            rows={12}
            placeholder="Paste the contract or agreement text…"
            className="min-h-48 resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-800 outline-none ring-slate-400 focus:bg-white focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-950"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Policy Text</span>
          <textarea
            value={policyText}
            onChange={(event) => onPolicyTextChange(event.target.value)}
            rows={12}
            placeholder="Optional internal playbook or policy notes…"
            className="min-h-48 resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-800 outline-none ring-slate-400 focus:bg-white focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-950"
          />
        </label>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={isExtracting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isExtracting ? "Extracting…" : "Extract & Analyze"}
        </button>
      </div>
    </form>
  );
}
