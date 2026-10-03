export type CategoryType =
  | "parties"
  | "effective_date"
  | "expiry"
  | "renewal"
  | "termination"
  | "notice"
  | "obligation";

export type CertaintyStatus = "confirmed" | "uncertain";

export type ReviewStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "edited"
  | "stale";

export interface ExtractedItem {
  id: string;
  category: CategoryType;
  title: string;
  value: string;
  responsibleParty?: string;
  deadline?: string;
  /** Verbatim quote or citation from the source contract. */
  sourceSection: string;
  status: CertaintyStatus;
  reasoning: string;
  clarificationQuestion?: string;
  reviewStatus: ReviewStatus;
  editedValue?: string;
}

export interface ContractVersion {
  id: string;
  versionNumber: number;
  rawText: string;
  policyText?: string;
  createdAt: string;
}

export interface Contract {
  id: string;
  title: string;
  currentVersionId: string;
  versions: ContractVersion[];
  items: ExtractedItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ObligationReminder {
  id: string;
  itemId: string;
  title: string;
  deadlineDate: string;
  noticeDays: number;
  calculatedReminderDate: string;
  isOverdue: boolean;
  responsibleParty?: string;
}

export interface ContractSummary {
  totalItems: number;
  confirmedCount: number;
  uncertainCount: number;
  pendingReviews: number;
  approvedCount: number;
  staleCount: number;
  reminders: ObligationReminder[];
  disclaimer: string;
}
