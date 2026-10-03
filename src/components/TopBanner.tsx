"use client";

import { Scale, ShieldAlert, Upload } from "lucide-react";

interface TopBannerProps {
  versionNumber: number;
  onUploadNewVersion: () => void;
}

export function TopBanner({ versionNumber, onUploadNewVersion }: TopBannerProps) {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
            <Scale className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Contract Assistant
              </h1>
              {versionNumber > 0 ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Version {versionNumber}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Informational contract management workspace
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-semibold tracking-wide text-amber-950 uppercase dark:border-amber-700 dark:bg-amber-900/70 dark:text-amber-50">
            <ShieldAlert className="h-3.5 w-3.5" />
            Informational Tool — Not Legal Advice
          </span>
          <button
            type="button"
            onClick={onUploadNewVersion}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            <Upload className="h-4 w-4" />
            Upload New Version
          </button>
        </div>
      </div>
    </header>
  );
}
