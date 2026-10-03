import { format, isBefore, isValid, parseISO, startOfDay, subDays } from "date-fns";

import type { ContractSummary, ExtractedItem, ObligationReminder } from "@/types/contract";

export const LEGAL_DISCLAIMER =
  "NOTICE: This system is strictly an informational management tool. It does not provide legal advice, legal interpretation, or professional counsel.";

export interface ReminderDateResult {
  reminderDate: string | null;
  isOverdue: boolean;
  isValid: boolean;
  error?: string;
}

function parseCalendarDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const datePortion = trimmed.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? trimmed;
  const parsed = parseISO(datePortion);
  if (!isValid(parsed)) {
    return null;
  }

  return startOfDay(parsed);
}

function formatCalendarDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function parseNoticeDaysFromValue(value: string): number | null {
  const match = value.trim().match(/(\d+)/);
  if (!match) {
    return null;
  }

  const parsed = Number.parseInt(match[1], 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function resolveNoticeDays(items: ExtractedItem[]): number {
  const noticeItem = items.find((item) => item.category === "notice");
  if (!noticeItem) {
    return 0;
  }

  const source = noticeItem.editedValue ?? noticeItem.value;
  return parseNoticeDaysFromValue(source) ?? 0;
}

export function calculateReminderDate(
  expiryDateStr: string,
  noticeDays: number,
  bufferDays = 0,
): ReminderDateResult {
  if (!Number.isFinite(noticeDays) || noticeDays < 0 || !Number.isInteger(noticeDays)) {
    return {
      reminderDate: null,
      isOverdue: false,
      isValid: false,
      error: "noticeDays must be a non-negative integer",
    };
  }

  if (!Number.isFinite(bufferDays) || bufferDays < 0 || !Number.isInteger(bufferDays)) {
    return {
      reminderDate: null,
      isOverdue: false,
      isValid: false,
      error: "bufferDays must be a non-negative integer",
    };
  }

  const expiryDate = parseCalendarDate(expiryDateStr);
  if (!expiryDate) {
    return {
      reminderDate: null,
      isOverdue: false,
      isValid: false,
      error: "expiryDateStr must be a valid ISO date",
    };
  }

  const reminder = startOfDay(subDays(expiryDate, noticeDays + bufferDays));
  const today = startOfDay(new Date());

  return {
    reminderDate: formatCalendarDate(reminder),
    isOverdue: isBefore(reminder, today),
    isValid: true,
  };
}

export function markStaleOnNewVersion(previousItems: ExtractedItem[]): ExtractedItem[] {
  return previousItems.map((item) => {
    if (item.reviewStatus === "approved" || item.reviewStatus === "edited") {
      return { ...item, reviewStatus: "stale" };
    }

    return { ...item };
  });
}

export function generateContractSummary(items: ExtractedItem[]): ContractSummary {
  const noticeDays = resolveNoticeDays(items);
  const reminders: ObligationReminder[] = [];

  for (const item of items) {
    const deadline = item.deadline?.trim();
    if (!deadline) {
      continue;
    }

    const calculated = calculateReminderDate(deadline, noticeDays);
    if (!calculated.isValid || !calculated.reminderDate) {
      continue;
    }

    reminders.push({
      id: `reminder-${item.id}`,
      itemId: item.id,
      title: item.title,
      deadlineDate: deadline,
      noticeDays,
      calculatedReminderDate: calculated.reminderDate,
      isOverdue: calculated.isOverdue,
      responsibleParty: item.responsibleParty,
    });
  }

  return {
    totalItems: items.length,
    confirmedCount: items.filter((item) => item.status === "confirmed").length,
    uncertainCount: items.filter((item) => item.status === "uncertain").length,
    pendingReviews: items.filter((item) => item.reviewStatus === "pending").length,
    approvedCount: items.filter((item) => item.reviewStatus === "approved").length,
    staleCount: items.filter((item) => item.reviewStatus === "stale").length,
    reminders,
    disclaimer: LEGAL_DISCLAIMER,
  };
}
