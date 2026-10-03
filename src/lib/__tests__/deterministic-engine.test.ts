import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ExtractedItem } from "@/types/contract";
import {
  LEGAL_DISCLAIMER,
  calculateReminderDate,
  generateContractSummary,
  markStaleOnNewVersion,
} from "@/lib/deterministic-engine";

function makeItem(overrides: Partial<ExtractedItem> & Pick<ExtractedItem, "id">): ExtractedItem {
  return {
    category: "obligation",
    title: "Untitled",
    value: "",
    sourceSection: "Section 1",
    status: "confirmed",
    reasoning: "Extracted from contract",
    reviewStatus: "pending",
    ...overrides,
  };
}

describe("calculateReminderDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-03T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("subtracts notice days from an ISO date", () => {
    const result = calculateReminderDate("2026-12-31", 30);

    expect(result).toEqual({
      reminderDate: "2026-12-01",
      isOverdue: false,
      isValid: true,
    });
  });

  it("applies optional buffer days on top of notice days", () => {
    const result = calculateReminderDate("2026-12-31", 30, 5);

    expect(result.isValid).toBe(true);
    expect(result.reminderDate).toBe("2026-11-26");
    expect(result.isOverdue).toBe(false);
  });

  it("treats a zero-day notice as the expiry date itself", () => {
    const result = calculateReminderDate("2026-10-03", 0);

    expect(result.isValid).toBe(true);
    expect(result.reminderDate).toBe("2026-10-03");
    expect(result.isOverdue).toBe(false);
  });

  it("marks reminders before today as overdue, including past expiries", () => {
    const overdueReminder = calculateReminderDate("2026-10-04", 2);
    const pastExpiry = calculateReminderDate("2025-01-15", 0);

    expect(overdueReminder).toMatchObject({
      reminderDate: "2026-10-02",
      isOverdue: true,
      isValid: true,
    });
    expect(pastExpiry.isOverdue).toBe(true);
    expect(pastExpiry.reminderDate).toBe("2025-01-15");
  });

  it("handles leap-year calendar arithmetic deterministically", () => {
    const leapDayExpiry = calculateReminderDate("2024-02-29", 0);
    const fromMarchLeapYear = calculateReminderDate("2024-03-01", 1);
    const fromMarchNonLeapYear = calculateReminderDate("2025-03-01", 1);
    const acrossLeapDay = calculateReminderDate("2024-03-10", 40);

    expect(leapDayExpiry.reminderDate).toBe("2024-02-29");
    expect(fromMarchLeapYear.reminderDate).toBe("2024-02-29");
    expect(fromMarchNonLeapYear.reminderDate).toBe("2025-02-28");
    expect(acrossLeapDay.reminderDate).toBe("2024-01-30");
    expect(leapDayExpiry.isValid).toBe(true);
  });

  it("parses full ISO timestamps as calendar dates", () => {
    const result = calculateReminderDate("2027-01-15T23:59:59.000Z", 15);

    expect(result.isValid).toBe(true);
    expect(result.reminderDate).toBe("2026-12-31");
  });

  it("rejects invalid ISO dates and negative day counts", () => {
    expect(calculateReminderDate("not-a-date", 10)).toEqual({
      reminderDate: null,
      isOverdue: false,
      isValid: false,
      error: "expiryDateStr must be a valid ISO date",
    });

    expect(calculateReminderDate("2026-13-40", 10).isValid).toBe(false);

    expect(calculateReminderDate("2026-12-31", -1)).toEqual({
      reminderDate: null,
      isOverdue: false,
      isValid: false,
      error: "noticeDays must be a non-negative integer",
    });

    expect(calculateReminderDate("2026-12-31", 1.5).isValid).toBe(false);
    expect(calculateReminderDate("2026-12-31", 1, -2).error).toBe(
      "bufferDays must be a non-negative integer",
    );
  });
});

describe("markStaleOnNewVersion", () => {
  it("converts approved and edited items to stale without mutating inputs", () => {
    const previousItems: ExtractedItem[] = [
      makeItem({ id: "1", reviewStatus: "approved", title: "Term" }),
      makeItem({ id: "2", reviewStatus: "edited", title: "Notice", editedValue: "45 days" }),
      makeItem({ id: "3", reviewStatus: "pending", title: "Parties" }),
      makeItem({ id: "4", reviewStatus: "rejected", title: "Renewal" }),
      makeItem({ id: "5", reviewStatus: "stale", title: "Expiry" }),
    ];

    const nextItems = markStaleOnNewVersion(previousItems);

    expect(nextItems.map((item) => item.reviewStatus)).toEqual([
      "stale",
      "stale",
      "pending",
      "rejected",
      "stale",
    ]);
    expect(previousItems[0].reviewStatus).toBe("approved");
    expect(previousItems[1].reviewStatus).toBe("edited");
    expect(nextItems[1].editedValue).toBe("45 days");
    expect(nextItems).not.toBe(previousItems);
    expect(nextItems[0]).not.toBe(previousItems[0]);
  });
});

describe("generateContractSummary", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-03T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("computes review metrics, reminder dates, and the legal disclaimer", () => {
    const items: ExtractedItem[] = [
      makeItem({
        id: "notice-1",
        category: "notice",
        title: "Notice period",
        value: "30 days written notice",
        status: "confirmed",
        reviewStatus: "approved",
      }),
      makeItem({
        id: "expiry-1",
        category: "expiry",
        title: "Contract expiry",
        value: "2026-12-31",
        deadline: "2026-12-31",
        responsibleParty: "Acme Corp",
        status: "confirmed",
        reviewStatus: "approved",
      }),
      makeItem({
        id: "obligation-1",
        category: "obligation",
        title: "Insurance certificate",
        value: "Provide annually",
        deadline: "2026-10-01",
        status: "uncertain",
        reviewStatus: "pending",
        clarificationQuestion: "Which party must provide the certificate?",
      }),
      makeItem({
        id: "parties-1",
        category: "parties",
        title: "Parties",
        value: "Acme and Beta",
        status: "confirmed",
        reviewStatus: "stale",
      }),
      makeItem({
        id: "renewal-1",
        category: "renewal",
        title: "Auto-renewal",
        value: "One year",
        deadline: "not-a-date",
        status: "uncertain",
        reviewStatus: "edited",
      }),
    ];

    const summary = generateContractSummary(items);

    expect(summary.totalItems).toBe(5);
    expect(summary.confirmedCount).toBe(3);
    expect(summary.uncertainCount).toBe(2);
    expect(summary.pendingReviews).toBe(1);
    expect(summary.approvedCount).toBe(2);
    expect(summary.staleCount).toBe(1);
    expect(summary.disclaimer).toBe(LEGAL_DISCLAIMER);
    expect(summary.reminders).toEqual([
      {
        id: "reminder-expiry-1",
        itemId: "expiry-1",
        title: "Contract expiry",
        deadlineDate: "2026-12-31",
        noticeDays: 30,
        calculatedReminderDate: "2026-12-01",
        isOverdue: false,
        responsibleParty: "Acme Corp",
      },
      {
        id: "reminder-obligation-1",
        itemId: "obligation-1",
        title: "Insurance certificate",
        deadlineDate: "2026-10-01",
        noticeDays: 30,
        calculatedReminderDate: "2026-09-01",
        isOverdue: true,
        responsibleParty: undefined,
      },
    ]);
  });

  it("uses zero notice days when no notice item is present", () => {
    const summary = generateContractSummary([
      makeItem({
        id: "expiry-2",
        category: "expiry",
        title: "End date",
        value: "2026-11-01",
        deadline: "2026-11-01",
      }),
    ]);

    expect(summary.reminders[0]?.noticeDays).toBe(0);
    expect(summary.reminders[0]?.calculatedReminderDate).toBe("2026-11-01");
  });
});
