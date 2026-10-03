'use client';

import React, { useState } from 'react';
import { ExtractedItem, ContractSummary } from '@/types/contract';
import { generateContractSummary } from '@/lib/deterministic-engine';
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Clock, 
  Calendar, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  ShieldAlert,
  Save,
  Check
} from 'lucide-react';

interface WorkbenchProps {
  contractText: string;
  items: ExtractedItem[];
  onItemsChange: (items: ExtractedItem[]) => void;
  onSimulateNewVersion: () => void;
}

export default function ContractWorkbench({ 
  contractText, 
  items, 
  onItemsChange,
  onSimulateNewVersion 
}: WorkbenchProps) {
  const [activeTab, setActiveTab] = useState<'review' | 'deadlines' | 'summary'>('review');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const summary: ContractSummary = generateContractSummary(items);

  const handleStatusChange = (id: string, newStatus: ExtractedItem['reviewStatus']) => {
    onItemsChange(
      items.map((item) => (item.id === id ? { ...item, reviewStatus: newStatus } : item))
    );
    showToast(`Item marked as ${newStatus}`);
  };

  const startEditing = (item: ExtractedItem) => {
    setEditingId(item.id);
    setEditValue(item.editedValue || item.value);
  };

  const saveEdit = (id: string) => {
    onItemsChange(
      items.map((item) =>
        item.id === id ? { ...item, editedValue: editValue, reviewStatus: 'edited' } : item
      )
    );
    setEditingId(null);
    showToast('Changes saved');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 z-50 animate-bounce">
          <Check className="h-4 w-4 text-emerald-400" /> {toastMessage}
        </div>
      )}

      {/* Top Banner Notice */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-xs md:text-sm text-amber-900 font-medium">
            <strong>Informational Tool Only:</strong> This application assists with contract tracking and does not provide legal advice.
          </p>
        </div>
        <button
          onClick={onSimulateNewVersion}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-amber-300 rounded-lg hover:bg-amber-50 text-amber-900 transition shadow-sm shrink-0"
          title="Simulate drift by marking approved items as stale"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Upload New Version (Simulate Drift)
        </button>
      </div>

      {/* Main Split-Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane: Contract Document Viewer */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col h-[700px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-slate-800 text-sm">Contract Document Text</h3>
            </div>
            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-mono">
              v1.0 (Active)
            </span>
          </div>
          <div className="flex-1 overflow-y-auto font-mono text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
            {contractText}
          </div>
        </div>

        {/* Right Pane: Workbench & Reviews */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col h-[700px]">
          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 pb-2 mb-4 gap-3">
            <button
              onClick={() => setActiveTab('review')}
              className={`pb-2 px-3 text-sm font-semibold transition border-b-2 ${
                activeTab === 'review'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Extraction Review ({items.length})
            </button>
            <button
              onClick={() => setActiveTab('deadlines')}
              className={`pb-2 px-3 text-sm font-semibold transition border-b-2 ${
                activeTab === 'deadlines'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Deadlines & Reminders ({summary.reminders.length})
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`pb-2 px-3 text-sm font-semibold transition border-b-2 ${
                activeTab === 'summary'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Summary & Audit
            </button>
          </div>

          {/* Tab Content Container */}
          <div className="flex-1 overflow-y-auto pr-1">
            {/* Tab 1: Extraction Review */}
            {activeTab === 'review' && (
              <div className="space-y-4">
                {items.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-10">No items extracted yet.</p>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className={`border rounded-xl p-4 transition ${
                        item.reviewStatus === 'stale'
                          ? 'border-amber-400 bg-amber-50/50'
                          : item.reviewStatus === 'approved'
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : item.reviewStatus === 'rejected'
                          ? 'border-rose-200 bg-rose-50/20 opacity-60'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      {item.reviewStatus === 'stale' && (
                        <div className="mb-3 px-3 py-1.5 bg-amber-100 text-amber-900 rounded-lg text-xs font-semibold flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                          Potentially Stale: Review needed following document version update.
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {item.category}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded font-semibold ${
                                item.status === 'confirmed'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {item.status === 'confirmed' ? '✓ Confirmed' : '⚠ Uncertain'}
                            </span>
                          </div>
                          <h4 className="font-semibold text-slate-900 text-sm mt-1">{item.title}</h4>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded-md capitalize bg-slate-100 text-slate-700">
                          {item.reviewStatus}
                        </span>
                      </div>

                      <div className="my-2 text-xs text-slate-800">
                        {editingId === item.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full text-xs p-2 border border-blue-400 rounded-lg focus:outline-none"
                              rows={3}
                            />
                            <button
                              onClick={() => saveEdit(item.id)}
                              className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2.5 py-1 rounded-md hover:bg-blue-700 font-medium"
                            >
                              <Save className="h-3 w-3" /> Save Changes
                            </button>
                          </div>
                        ) : (
                          <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-medium">
                            {item.editedValue || item.value}
                          </p>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 italic mb-2">
                        <strong>Source Citation:</strong> &quot;{item.sourceSection}&quot;
                      </div>

                      {item.clarificationQuestion && (
                        <div className="my-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                          <div className="flex items-center gap-1.5 font-semibold text-amber-900 mb-1">
                            <HelpCircle className="h-3.5 w-3.5 text-amber-700" />
                            Clarification Needed:
                          </div>
                          <p className="text-amber-800 mb-2">{item.clarificationQuestion}</p>
                          <input
                            type="text"
                            placeholder="Type clarification resolution..."
                            value={clarificationAnswers[item.id] || ''}
                            onChange={(e) =>
                              setClarificationAnswers({
                                ...clarificationAnswers,
                                [item.id]: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 border border-amber-300 rounded text-xs focus:outline-none bg-white"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => startEditing(item)}
                          className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 font-medium transition"
                        >
                          <Edit3 className="h-3 w-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleStatusChange(item.id, 'rejected')}
                          className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 px-2 py-1 rounded hover:bg-rose-50 font-medium transition"
                        >
                          <Trash2 className="h-3 w-3" /> Reject
                        </button>
                        <button
                          onClick={() => handleStatusChange(item.id, 'approved')}
                          className="flex items-center gap-1 text-xs bg-emerald-600 text-white px-3 py-1 rounded-md hover:bg-emerald-700 font-semibold shadow-sm transition"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 2: Deadlines & Deterministic Reminders */}
            {activeTab === 'deadlines' && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                  <strong>Deterministic Date Engine:</strong> Reminders are calculated purely via date arithmetic from notice windows, avoiding LLM hallucinations.
                </div>
                {summary.reminders.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No explicit deadline clauses found.</p>
                ) : (
                  summary.reminders.map((rem) => (
                    <div
                      key={rem.id}
                      className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex items-start justify-between"
                    >
                      <div>
                        <h4 className="font-semibold text-slate-800 text-sm">{rem.title}</h4>
                        <div className="mt-2 space-y-1 text-xs text-slate-600">
                          <p className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <strong>Target Deadline:</strong> {rem.deadlineDate}
                          </p>
                          <p className="flex items-center gap-1.5 text-blue-700 font-medium">
                            <Clock className="h-3.5 w-3.5 text-blue-500" />
                            <strong>Calculated Notice Reminder:</strong> {new Date(rem.calculatedReminderDate).toLocaleDateString()} ({rem.noticeDays} days prior)
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          rem.isOverdue
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {rem.isOverdue ? 'Overdue' : 'Active'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Summary & Audit */}
            {activeTab === 'summary' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-100 rounded-xl">
                    <span className="text-slate-500 block">Total Items</span>
                    <strong className="text-lg text-slate-900">{summary.totalItems}</strong>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="text-emerald-700 block">Approved</span>
                    <strong className="text-lg text-emerald-800">{summary.approvedCount}</strong>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <span className="text-amber-700 block">Uncertain</span>
                    <strong className="text-lg text-amber-800">{summary.uncertainCount}</strong>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                    <span className="text-rose-700 block">Stale Items</span>
                    <strong className="text-lg text-rose-800">{summary.staleCount}</strong>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mt-4">
                  <h4 className="font-semibold text-slate-800">Legal Scope & Disclaimer</h4>
                  <p className="text-slate-600 leading-relaxed">{summary.disclaimer}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}