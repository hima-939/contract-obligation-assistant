import { z } from "zod";

import type { ExtractedItem } from "@/types/contract";

export const LEGAL_EXTRACT_DISCLAIMER =
  "NOTICE: This system is strictly an informational management tool. It does not provide legal advice, legal interpretation, or professional counsel.";

export type ExtractionSource = "mock" | "openai" | "gemini";

export interface ExtractContractInput {
  contractText: string;
  policyText?: string;
}

export interface ExtractContractResult {
  items: ExtractedItem[];
  source: ExtractionSource;
  disclaimer: string;
}

export class ExtractError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ExtractError";
  }
}

const categorySchema = z.enum([
  "parties",
  "effective_date",
  "expiry",
  "renewal",
  "termination",
  "notice",
  "obligation",
]);

const llmExtractedItemSchema = z.object({
  category: categorySchema,
  title: z.string().min(1),
  value: z.string().min(1),
  responsibleParty: z.string().min(1).nullable().optional(),
  deadline: z.string().min(1).nullable().optional(),
  sourceSection: z.string().min(1),
  status: z.enum(["confirmed", "uncertain"]),
  reasoning: z.string().min(1),
  clarificationQuestion: z.string().min(1).nullable().optional(),
});

const llmExtractionSchema = z.object({
  items: z.array(llmExtractedItemSchema),
});

const FALLBACK_EXTRACTED_ITEMS: ExtractedItem[] = [
  {
    id: "mock-parties",
    category: "parties",
    title: "Contracting parties",
    value: "Horizon Analytics LLC (Provider) and Northwind Logistics, Inc. (Customer)",
    sourceSection:
      'This Master Services Agreement ("Agreement") is entered into by and between Horizon Analytics LLC ("Provider") and Northwind Logistics, Inc. ("Customer").',
    status: "confirmed",
    reasoning:
      "The opening recitals identify both legal names and defined roles without conflicting aliases.",
    reviewStatus: "pending",
  },
  {
    id: "mock-effective-date",
    category: "effective_date",
    title: "Effective Date",
    value: "2026-01-15",
    sourceSection:
      'This Agreement is effective as of January 15, 2026 (the "Effective Date").',
    status: "confirmed",
    reasoning: "The Effective Date is stated as a calendar date in the preamble.",
    reviewStatus: "pending",
  },
  {
    id: "mock-renewal-notice",
    category: "notice",
    title: "Renewal notice period",
    value: "60 days",
    responsibleParty: "Either party",
    sourceSection:
      "Section 9.2: Either party may elect not to renew this Agreement by providing written notice to the other party at least sixty (60) days prior to the end of the then-current term.",
    status: "confirmed",
    reasoning:
      "Section 9.2 states a numeric sixty-day written non-renewal notice measured from the end of the then-current term.",
    reviewStatus: "pending",
  },
  {
    id: "mock-data-retention-audit",
    category: "obligation",
    title: "Data retention and audit access",
    value:
      "Vendor shall retain audit records for a commercially reasonable period and provide access upon request.",
    responsibleParty: "Provider",
    sourceSection:
      "Section 14.1: Vendor shall retain records reasonably necessary for audit and shall make such records available upon request for a commercially reasonable period.",
    status: "uncertain",
    reasoning:
      "Section 14.1 uses open-ended terms (reasonably necessary, commercially reasonable period, upon request) and does not specify duration, cost allocation, or audit scope.",
    clarificationQuestion:
      "What retention period applies, which party bears audit costs, and does “commercially reasonable” mean a fixed number of years or the Agreement term plus a tail period?",
    reviewStatus: "pending",
  },
  {
    id: "mock-soc2-obligation",
    category: "obligation",
    title: "Annual SOC 2 Type II report",
    value: "Deliver an annual SOC 2 Type II report to Customer no later than March 31 each year.",
    responsibleParty: "Provider",
    deadline: "2027-03-31",
    sourceSection:
      "Provider shall deliver an annual SOC 2 Type II report to Customer no later than March 31 of each calendar year.",
    status: "confirmed",
    reasoning:
      "The reporting obligation and calendar deadline are stated as a repeating operational requirement.",
    reviewStatus: "pending",
  },
  {
    id: "mock-insurance-obligation",
    category: "obligation",
    title: "Certificate of insurance",
    value:
      "Issue a certificate of insurance naming Provider as additional insured within 15 days after the Effective Date.",
    responsibleParty: "Customer",
    deadline: "2026-01-30",
    sourceSection:
      "Customer shall issue a certificate of insurance naming Provider as additional insured within fifteen (15) days after the Effective Date.",
    status: "confirmed",
    reasoning:
      "Fifteen days after the stated Effective Date of January 15, 2026 produces a January 30, 2026 operational deadline.",
    reviewStatus: "pending",
  },
];

const OPENAI_JSON_SCHEMA = {
  name: "contract_extraction",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            category: {
              type: "string",
              enum: [
                "parties",
                "effective_date",
                "expiry",
                "renewal",
                "termination",
                "notice",
                "obligation",
              ],
            },
            title: { type: "string" },
            value: { type: "string" },
            responsibleParty: { type: ["string", "null"] },
            deadline: { type: ["string", "null"] },
            sourceSection: { type: "string" },
            status: { type: "string", enum: ["confirmed", "uncertain"] },
            reasoning: { type: "string" },
            clarificationQuestion: { type: ["string", "null"] },
          },
          required: [
            "category",
            "title",
            "value",
            "responsibleParty",
            "deadline",
            "sourceSection",
            "status",
            "reasoning",
            "clarificationQuestion",
          ],
        },
      },
    },
    required: ["items"],
  },
} as const;

const GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          category: {
            type: "STRING",
            enum: [
              "parties",
              "effective_date",
              "expiry",
              "renewal",
              "termination",
              "notice",
              "obligation",
            ],
          },
          title: { type: "STRING" },
          value: { type: "STRING" },
          responsibleParty: { type: "STRING", nullable: true },
          deadline: { type: "STRING", nullable: true },
          sourceSection: { type: "STRING" },
          status: { type: "STRING", enum: ["confirmed", "uncertain"] },
          reasoning: { type: "STRING" },
          clarificationQuestion: { type: "STRING", nullable: true },
        },
        required: [
          "category",
          "title",
          "value",
          "sourceSection",
          "status",
          "reasoning",
        ],
      },
    },
  },
  required: ["items"],
} as const;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function getConfiguredLlmProvider(): Exclude<ExtractionSource, "mock"> | null {
  if (process.env.OPENAI_API_KEY?.trim()) {
    return "openai";
  }

  if (process.env.GEMINI_API_KEY?.trim()) {
    return "gemini";
  }

  return null;
}

export function getFallbackExtractedItems(): ExtractedItem[] {
  return FALLBACK_EXTRACTED_ITEMS.map((item) => ({ ...item }));
}

export function validateExtractInput(body: unknown): ExtractContractInput {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new ExtractError(
      "INVALID_INPUT",
      "Request body must be a JSON object.",
      400,
    );
  }

  const record = body as Record<string, unknown>;

  if (!("contractText" in record) || record.contractText === undefined || record.contractText === null) {
    throw new ExtractError(
      "CONTRACT_TEXT_REQUIRED",
      "contractText is required.",
      400,
    );
  }

  if (typeof record.contractText !== "string") {
    throw new ExtractError(
      "CONTRACT_TEXT_INVALID",
      "contractText must be a string.",
      400,
    );
  }

  if (record.contractText.trim() === "") {
    throw new ExtractError(
      "CONTRACT_TEXT_EMPTY",
      "contractText cannot be empty.",
      400,
    );
  }

  if (record.policyText !== undefined && record.policyText !== null && typeof record.policyText !== "string") {
    throw new ExtractError(
      "POLICY_TEXT_INVALID",
      "policyText must be a string when provided.",
      400,
    );
  }

  return {
    contractText: record.contractText,
    policyText:
      typeof record.policyText === "string" && record.policyText.trim() !== ""
        ? record.policyText
        : undefined,
  };
}

function buildExtractionPrompt(input: ExtractContractInput): string {
  const policyBlock = input.policyText
    ? `\nInternal playbook (informational only, not legal advice):\n${input.policyText}\n`
    : "";

  return `You extract structured contract-management fields. You do not provide legal advice, legal interpretation, or professional counsel.

Return only items grounded in the source text. sourceSection must be a verbatim quote or section citation. Mark status "uncertain" when the text is ambiguous and include clarificationQuestion. Use ISO dates (YYYY-MM-DD) for deadline when a calendar date can be determined.
${policyBlock}
Contract text:
${input.contractText}`;
}

function toExtractedItems(rawItems: z.infer<typeof llmExtractedItemSchema>[]): ExtractedItem[] {
  return rawItems.map((item) => ({
    id: crypto.randomUUID(),
    category: item.category,
    title: item.title,
    value: item.value,
    responsibleParty: item.responsibleParty ?? undefined,
    deadline: item.deadline ?? undefined,
    sourceSection: item.sourceSection,
    status: item.status,
    reasoning: item.reasoning,
    clarificationQuestion: item.clarificationQuestion ?? undefined,
    reviewStatus: "pending",
  }));
}

function parseStructuredItems(payload: unknown): ExtractedItem[] {
  const parsed = llmExtractionSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ExtractError(
      "STRUCTURED_OUTPUT_INVALID",
      "The model response did not match the extraction schema.",
      502,
      parsed.error.flatten(),
    );
  }

  return toExtractedItems(parsed.data.items);
}

async function extractWithOpenAi(input: ExtractContractInput): Promise<ExtractedItem[]> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new ExtractError("OPENAI_KEY_MISSING", "OPENAI_API_KEY is not configured.", 500);
  }

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "Extract contract management fields as JSON. Do not provide legal advice.",
          },
          { role: "user", content: buildExtractionPrompt(input) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: OPENAI_JSON_SCHEMA,
        },
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    throw new ExtractError(
      "OPENAI_REQUEST_FAILED",
      "The OpenAI extraction request failed.",
      502,
      error instanceof Error ? error.message : undefined,
    );
  }

  const body = (await response.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!response.ok) {
    throw new ExtractError(
      "OPENAI_REQUEST_FAILED",
      body.error?.message || "OpenAI returned an error response.",
      502,
    );
  }

  const content = body.choices?.[0]?.message?.content;
  if (!content) {
    throw new ExtractError(
      "OPENAI_EMPTY_RESPONSE",
      "OpenAI returned an empty structured response.",
      502,
    );
  }

  try {
    return parseStructuredItems(JSON.parse(content) as unknown);
  } catch (error) {
    if (error instanceof ExtractError) {
      throw error;
    }

    throw new ExtractError(
      "OPENAI_INVALID_JSON",
      "OpenAI returned content that was not valid JSON.",
      502,
    );
  }
}

async function extractWithGemini(input: ExtractContractInput): Promise<ExtractedItem[]> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new ExtractError("GEMINI_KEY_MISSING", "GEMINI_API_KEY is not configured.", 500);
  }

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildExtractionPrompt(input) }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: GEMINI_RESPONSE_SCHEMA,
        },
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    throw new ExtractError(
      "GEMINI_REQUEST_FAILED",
      "The Gemini extraction request failed.",
      502,
      error instanceof Error ? error.message : undefined,
    );
  }

  const body = (await response.json()) as {
    error?: { message?: string };
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  if (!response.ok) {
    throw new ExtractError(
      "GEMINI_REQUEST_FAILED",
      body.error?.message || "Gemini returned an error response.",
      502,
    );
  }

  const content = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
  if (!content) {
    throw new ExtractError(
      "GEMINI_EMPTY_RESPONSE",
      "Gemini returned an empty structured response.",
      502,
    );
  }

  try {
    return parseStructuredItems(JSON.parse(content) as unknown);
  } catch (error) {
    if (error instanceof ExtractError) {
      throw error;
    }

    throw new ExtractError(
      "GEMINI_INVALID_JSON",
      "Gemini returned content that was not valid JSON.",
      502,
    );
  }
}

export async function extractContract(input: ExtractContractInput): Promise<ExtractContractResult> {
  const provider = getConfiguredLlmProvider();

  if (!provider) {
    await delay(1000);
    return {
      items: getFallbackExtractedItems(),
      source: "mock",
      disclaimer: LEGAL_EXTRACT_DISCLAIMER,
    };
  }

  const items =
    provider === "openai" ? await extractWithOpenAi(input) : await extractWithGemini(input);

  return {
    items,
    source: provider,
    disclaimer: LEGAL_EXTRACT_DISCLAIMER,
  };
}
