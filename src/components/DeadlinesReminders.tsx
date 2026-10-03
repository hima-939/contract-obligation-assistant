"use client";

import { format, parseISO } from "date-fns";
import { AlertTriangle, CalendarClock } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ObligationReminder } from "@/types/contract";

interface DeadlinesRemindersProps {
  reminders: ObligationReminder[];
}

export function DeadlinesReminders({ reminders }: DeadlinesRemindersProps) {
  if (reminders.length === 0) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
        No dated obligations yet. Extract a contract that includes deadlines to build the reminder timeline.
      </div>
    );
  }

  const sorted = [...reminders].sort((a, b) => a.calculatedReminderDate.localeCompare(b.calculatedReminderDate));

  return (
    <ol className="relative space-y-4 border-l border-slate-200 pl-5 dark:border-slate-800">
      {sorted.map((reminder) => (
        <li key={reminder.id} className="relative">
          <span
            className={cn(
              "absolute top-1.5 -left-[1.45rem] h-3 w-3 rounded-full border-2 border-white dark:border-slate-950",
              reminder.isOverdue ? "bg-red-500" : "bg-indigo-500",
            )}
          />
          <div
            className={cn(
              "rounded-xl border p-4",
              reminder.isOverdue
                ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
                : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{reminder.title}</h3>
                {reminder.responsibleParty ? (
                  <p className="text-xs text-slate-500">{reminder.responsibleParty}</p>
                ) : null}
              </div>
              {reminder.isOverdue ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800 dark:bg-red-900 dark:text-red-100">
                  <AlertTriangle className="h-3 w-3" />
                  Overdue
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
                  <CalendarClock className="h-3 w-3" />
                  Upcoming
                </span>
              )}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
              <div>
                <dt className="text-slate-400">Deadline</dt>
                <dd className="font-medium">{formatDate(reminder.deadlineDate)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Reminder date</dt>
                <dd className="font-medium">{formatDate(reminder.calculatedReminderDate)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Notice days</dt>
                <dd className="font-medium">{reminder.noticeDays}</dd>
              </div>
            </dl>
          </div>
        </li>
      ))}
    </ol>
  );
}

function formatDate(value: string): string {
  try {
    return format(parseISO(value), "MMM d, yyyy");
  } catch {
    return value;
  }
}
