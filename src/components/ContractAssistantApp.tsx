"use client";

import { CalendarClock, ClipboardList, LayoutDashboard, Loader2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { ContractViewer } from "@/components/ContractViewer";
import { DeadlinesReminders } from "@/components/DeadlinesReminders";
import { ExtractionReview } from "@/components/ExtractionReview";
import { InputForm } from "@/components/InputForm";
import { SummaryCard } from "@/components/SummaryCard";
import { ToastViewport, type ToastItem, type ToastTone } from "@/components/ToastViewport";
import { TopBanner } from "@/components/TopBanner";
import { generateContractSummary, markStaleOnNewVersion } from "@/lib/deterministic-engine";
import { SAMPLE_CONTRACT_TEXT, SAMPLE_POLICY_TEXT } from "@/lib/sample-contract";
import { cn } from "@/lib/utils";
import type { ExtractedItem } from "@/types/contract";

type DashboardTab = "review" | "deadlines" | "summary";

interface ExtractApiSuccess {
  items: ExtractedItem[];
  source: string;
  disclaimer: string;
}

interface ExtractApiError {
  error?: { code?: string; message?: string };
}

export function ContractAssistantApp() {
  const [contractText, setContractText] = useState("");
  const [policyText, setPolicyText] = useState("");
  const [items, setItems] = useState<ExtractedItem[]>([]);
  const [source, setSource] = useState<string | null>(null);
  const [versionNumber, setVersionNumber] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [hasExtracted, setHasExtracted] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>("review");
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isCopying, setIsCopying] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const summary = useMemo(() => generateContractSummary(items), [items]);

  function pushToast(tone: ToastTone, message: string) {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, tone, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  }

  function updateItem(id: string, patch: Partial<ExtractedItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function applyStaleOnNewVersion(previous: ExtractedItem[], next: ExtractedItem[]): ExtractedItem[] {
    if (previous.length === 0) {
      return next;
    }

    const stalePrevious = markStaleOnNewVersion(previous);
    const byId = new Map(stalePrevious.map((item) => [item.id, item]));
    const byKey = new Map(stalePrevious.map((item) => [`${item.category}:${item.title}`, item]));

    return next.map((item) => {
      const prior = byId.get(item.id) ?? byKey.get(`${item.category}:${item.title}`);
      if (prior?.reviewStatus === "stale") {
        return { ...item, reviewStatus: "stale" };
      }
      return item;
    });
  }

  async function handleExtract() {
    if (!contractText.trim()) {
      pushToast("error", "Contract text is required.");
      return;
    }

    setIsExtracting(true);
    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractText,
          policyText: policyText.trim() ? policyText : undefined,
        }),
      });

      const payload = (await response.json()) as ExtractApiSuccess & ExtractApiError;

      if (!response.ok) {
        throw new Error(payload.error?.message || "Extraction failed.");
      }

      setItems((previous) => applyStaleOnNewVersion(previous, payload.items ?? []));
      setSource(payload.source);
      setVersionNumber((current) => current + 1);
      setHasExtracted(true);
      setShowForm(false);
      setActiveTab("review");
      pushToast(
        "success",
        payload.source === "mock"
          ? "Offline mock extraction ready for review."
          : `Extraction complete via ${payload.source}.`,
      );
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Extraction failed.");
    } finally {
      setIsExtracting(false);
    }
  }

  async function handleCopySummary() {
    const lines = [
      `Total items: ${summary.totalItems}`,
      `Confirmed: ${summary.confirmedCount}`,
      `Uncertain: ${summary.uncertainCount}`,
      `Pending reviews: ${summary.pendingReviews}`,
      `Approved: ${summary.approvedCount}`,
      `Stale: ${summary.staleCount}`,
      "",
      summary.disclaimer,
    ];

    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      pushToast("success", "Summary copied to clipboard.");
    } catch {
      pushToast("error", "Could not copy the summary.");
    } finally {
      setIsCopying(false);
    }
  }

  function handleUploadNewVersion() {
    setShowForm(true);
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    pushToast("info", "Upload a new version, then extract to flag previously approved items as stale.");
  }

  const tabs: Array<{ id: DashboardTab; label: string; icon: typeof ClipboardList }> = [
    { id: "review", label: "Extraction Review", icon: ClipboardList },
    { id: "deadlines", label: "Deadlines & Reminders", icon: CalendarClock },
    { id: "summary", label: "Summary", icon: LayoutDashboard },
  ];

  return (
    <div className="flex min-h-full flex-col bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <TopBanner versionNumber={versionNumber} onUploadNewVersion={handleUploadNewVersion} />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6">
        {showForm ? (
          <div ref={formRef}>
            <InputForm
              contractText={contractText}
              policyText={policyText}
              isExtracting={isExtracting}
              onContractTextChange={setContractText}
              onPolicyTextChange={setPolicyText}
              onLoadSample={() => {
                setContractText(SAMPLE_CONTRACT_TEXT);
                setPolicyText(SAMPLE_POLICY_TEXT);
                pushToast("info", "Sample contract and playbook loaded.");
              }}
              onSubmit={handleExtract}
            />
          </div>
        ) : null}

        {isExtracting ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-10 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin" />
            Analyzing contract fields…
          </div>
        ) : null}

        {!hasExtracted && !isExtracting ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-950">
            <p className="text-base font-medium text-slate-800 dark:text-slate-100">No analysis yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Load the sample contract or paste your own text, then choose Extract & Analyze to open the review
              dashboard.
            </p>
          </div>
        ) : null}

        {hasExtracted && !isExtracting ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <ContractViewer contractText={contractText} />
            <section className="flex min-h-[32rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex flex-wrap gap-1 border-b border-slate-200 p-2 dark:border-slate-800">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                        isActive
                          ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-50"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex-1 overflow-auto p-4">
                {activeTab === "review" ? (
                  <ExtractionReview
                    items={items}
                    clarificationAnswers={clarificationAnswers}
                    onClarificationChange={(id, value) =>
                      setClarificationAnswers((current) => ({ ...current, [id]: value }))
                    }
                    onApprove={(id) => {
                      updateItem(id, { reviewStatus: "approved" });
                      pushToast("success", "Item approved.");
                    }}
                    onReject={(id) => {
                      updateItem(id, { reviewStatus: "rejected" });
                      pushToast("info", "Item rejected.");
                    }}
                    onEdit={(id, editedValue) => {
                      updateItem(id, { editedValue, reviewStatus: "edited" });
                      pushToast("success", "Item updated.");
                    }}
                  />
                ) : null}
                {activeTab === "deadlines" ? <DeadlinesReminders reminders={summary.reminders} /> : null}
                {activeTab === "summary" ? (
                  <SummaryCard
                    summary={summary}
                    sourceLabel={source ?? undefined}
                    isCopying={isCopying}
                    onCopy={handleCopySummary}
                  />
                ) : null}
              </div>
            </section>
          </div>
        ) : null}
      </main>

      <ToastViewport toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
    </div>
  );
}
