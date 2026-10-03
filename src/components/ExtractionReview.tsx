"use client";

import { Check, Pencil, X } from "lucide-react";
import { useState } from "react";

import { citationTag, cn, formatCategory } from "@/lib/utils";
import type { ExtractedItem } from "@/types/contract";

interface ExtractionReviewProps {
  items: ExtractedItem[];
  clarificationAnswers: Record<string, string>;
  onClarificationChange: (id: string, value: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string, editedValue: string) => void;
}

export function ExtractionReview({
  items,
  clarificationAnswers,
  onClarificationChange,
  onApprove,
  onReject,
  onEdit,
}: ExtractionReviewProps) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
        No extracted items yet. Run Extract & Analyze to populate the review queue.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <ExtractionCard
          key={item.id}
          item={item}
          clarificationAnswer={clarificationAnswers[item.id] ?? ""}
          onClarificationChange={onClarificationChange}
          onApprove={onApprove}
          onReject={onReject}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

interface ExtractionCardProps {
  item: ExtractedItem;
  clarificationAnswer: string;
  onClarificationChange: (id: string, value: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string, editedValue: string) => void;
}

function ExtractionCard({
  item,
  clarificationAnswer,
  onClarificationChange,
  onApprove,
  onReject,
  onEdit,
}: ExtractionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(item.editedValue ?? item.value);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-300">
          {formatCategory(item.category)}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
            item.status === "confirmed"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
              : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
          )}
        >
          {item.status === "confirmed" ? "Confirmed" : "Uncertain"}
        </span>
        <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-[11px] text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
          {citationTag(item.sourceSection)}
        </span>
        <span className="ml-auto text-[11px] font-medium text-slate-400 capitalize">{item.reviewStatus}</span>
      </div>

      <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-50">{item.title}</h3>
      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{item.editedValue ?? item.value}</p>
      {item.responsibleParty ? (
        <p className="mt-1 text-xs text-slate-500">Responsible: {item.responsibleParty}</p>
      ) : null}
      <blockquote className="mt-3 border-l-2 border-slate-200 pl-3 text-xs leading-5 text-slate-500 italic dark:border-slate-700">
        {item.sourceSection}
      </blockquote>
      <p className="mt-2 text-xs text-slate-500">{item.reasoning}</p>

      {item.reviewStatus === "stale" ? (
        <div className="mt-3 rounded-lg border border-yellow-300 bg-yellow-100 px-3 py-2 text-sm font-medium text-yellow-950 dark:border-yellow-700 dark:bg-yellow-950/80 dark:text-yellow-50">
          Potentially Stale: Review needed following new contract version upload
        </div>
      ) : null}

      {item.status === "uncertain" || item.clarificationQuestion ? (
        <label className="mt-3 flex flex-col gap-1.5">
          <span className="text-xs font-medium text-amber-800 dark:text-amber-200">
            {item.clarificationQuestion ?? "Clarification needed"}
          </span>
          <input
            value={clarificationAnswer}
            onChange={(event) => onClarificationChange(item.id, event.target.value)}
            placeholder="Add a reviewer note or answer…"
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2 dark:border-amber-800 dark:bg-amber-950/40 dark:text-slate-100"
          />
        </label>
      ) : null}

      {isEditing ? (
        <div className="mt-3 flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-slate-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-950"
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-900"
              onClick={() => {
                onEdit(item.id, draft);
                setIsEditing(false);
              }}
            >
              Save edit
            </button>
            <button
              type="button"
              className="rounded-md px-3 py-1.5 text-xs text-slate-500"
              onClick={() => {
                setDraft(item.editedValue ?? item.value);
                setIsEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onApprove(item.id)}
          className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
        >
          <Check className="h-3.5 w-3.5" />
          Approve
        </button>
        <button
          type="button"
          onClick={() => onReject(item.id)}
          className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        >
          <X className="h-3.5 w-3.5" />
          Reject
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
      </div>
    </article>
  );
}
