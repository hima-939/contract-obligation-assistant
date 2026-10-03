"use client";

import { Copy, Loader2 } from "lucide-react";

import { LEGAL_DISCLAIMER } from "@/lib/deterministic-engine";
import type { ContractSummary } from "@/types/contract";

interface SummaryCardProps {
  summary: ContractSummary;
  sourceLabel?: string;
  isCopying?: boolean;
  onCopy: () => void;
}

export function SummaryCard({ summary, sourceLabel, isCopying, onCopy }: SummaryCardProps) {
  const metrics = [
    { label: "Total items", value: summary.totalItems },
    { label: "Confirmed", value: summary.confirmedCount },
    { label: "Uncertain", value: summary.uncertainCount },
    { label: "Pending reviews", value: summary.pendingReviews },
    { label: "Approved", value: summary.approvedCount },
    { label: "Stale", value: summary.staleCount },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Extraction summary</h3>
          {sourceLabel ? <p className="text-xs text-slate-500">Source: {sourceLabel}</p> : null}
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {isCopying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
          Copy summary
        </button>
      </div>

      {summary.totalItems === 0 ? (
        <p className="mt-8 text-center text-sm text-slate-500">
          Summary counts will appear here after an extraction.
        </p>
      ) : (
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-lg bg-slate-50 px-3 py-3 dark:bg-slate-950">
              <dt className="text-xs text-slate-500">{metric.label}</dt>
              <dd className="text-xl font-semibold text-slate-900 dark:text-slate-50">{metric.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 text-xs leading-5 font-medium text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100">
        {summary.disclaimer || LEGAL_DISCLAIMER}
      </div>
    </div>
  );
}
