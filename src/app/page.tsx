'use client';

import React, { useState } from 'react';
import ContractWorkbench from '@/components/ContractWorkbench';
import { ExtractedItem } from '@/types/contract';
import { markStaleOnNewVersion } from '@/lib/deterministic-engine';
import { Sparkles, Loader2, FileCheck } from 'lucide-react';

const SAMPLE_CONTRACT = `MASTER SERVICES AGREEMENT (MSA)

1. PARTIES & EFFECTIVE DATE
This Agreement is entered into on January 15, 2026, by and between Horizon Analytics LLC ("Vendor") and Northwind Logistics, Inc. ("Client").

2. TERM AND RENEWAL
The initial term shall commence on February 1, 2026, and continue until February 1, 2028. This Agreement shall automatically renew for successive 1-year terms unless either party provides written notice of non-renewal at least sixty (60) days prior to the expiration of the then-current term (Section 9.2).

3. SECURITY & AUDIT
Section 14.1: Vendor shall maintain SOC 2 Type II compliance and provide annual audit certificates by March 31, 2027. Remediation timelines for audit findings remain subject to mutual written agreement.
Vendor must deliver evidence of commercial liability insurance by January 30, 2026.`;

export default function Home() {
  const [contractText, setContractText] = useState(SAMPLE_CONTRACT);
  const [policyText, setPolicyText] = useState('');
  const [items, setItems] = useState<ExtractedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasExtracted, setHasExtracted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractText, policyText }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error?.message || 'Extraction failed');
      }

      const data = await res.json();
      setItems(data.items || []);
      setHasExtracted(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateNewVersion = () => {
    setItems((prev) => markStaleOnNewVersion(prev));
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-300 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Contract Obligation & Renewal Assistant
            </h1>
            <p className="text-sm text-slate-500">
              Structured contract extraction, human-in-the-loop review workbench, and deterministic reminder engine.
            </p>
          </div>
          <button
            onClick={handleExtract}
            disabled={loading || !contractText.trim()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium px-5 py-2.5 rounded-xl shadow transition text-sm w-fit"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing Contract...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {hasExtracted ? 'Re-extract & Analyze' : 'Extract & Analyze'}
              </>
            )}
          </button>
        </div>

        {/* Input Text Areas when not yet extracted or expanded */}
        {!hasExtracted && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Contract & Policy Input</h2>
              <button
                onClick={() => setContractText(SAMPLE_CONTRACT)}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
              >
                <FileCheck className="h-3.5 w-3.5" /> Reset to Sample Contract
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contract Document Text (Required)
                </label>
                <textarea
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  rows={10}
                  className="w-full text-xs font-mono p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  placeholder="Paste contract clauses here..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organizational Policy Document (Optional)
                </label>
                <textarea
                  value={policyText}
                  onChange={(e) => setPolicyText(e.target.value)}
                  rows={10}
                  className="w-full text-xs font-mono p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  placeholder="Paste optional organizational policy rules..."
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Workbench View once extracted */}
        {hasExtracted && (
          <ContractWorkbench
            contractText={contractText}
            items={items}
            onItemsChange={setItems}
            onSimulateNewVersion={handleSimulateNewVersion}
          />
        )}
      </div>
    </main>
  );
}