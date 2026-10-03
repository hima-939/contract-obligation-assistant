import { NextResponse } from "next/server";

import { ExtractError, extractContract, validateExtractInput } from "@/lib/extractor";

function errorResponse(error: ExtractError) {
  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        details: error.details ?? null,
      },
    },
    { status: error.status },
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(
      new ExtractError("INVALID_JSON", "Request body must be valid JSON.", 400),
    );
  }

  try {
    const input = validateExtractInput(body);
    const result = await extractContract(input);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ExtractError) {
      return errorResponse(error);
    }

    return errorResponse(
      new ExtractError(
        "EXTRACTION_FAILED",
        "Contract extraction failed.",
        500,
        error instanceof Error ? error.message : undefined,
      ),
    );
  }
}
