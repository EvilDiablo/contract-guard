import { NextResponse } from "next/server";
import {
  compareJson,
  formatMarkdownReport,
  generateSchemas,
  normalizeValue,
  type JsonValue,
} from "@api-diff/core";

export const runtime = "nodejs";

interface DiffBody {
  baseline: JsonValue;
  candidate: JsonValue;
  ignorePaths?: string[];
  side?: "response" | "request";
  title?: string;
  generateCode?: boolean;
  typeName?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DiffBody;
    if (body.baseline === undefined || body.candidate === undefined) {
      return NextResponse.json(
        { error: "baseline and candidate JSON are required" },
        { status: 400 },
      );
    }

    const report = compareJson(body.baseline, body.candidate, {
      ignorePaths: body.ignorePaths,
      side: body.side ?? "response",
    });

    const markdown = formatMarkdownReport(
      report,
      body.title ?? "API Diff Report",
    );

    let codegen: { typescript: string; zod: string } | undefined;
    if (body.generateCode) {
      const schema = normalizeValue(body.candidate);
      codegen = generateSchemas(schema, {
        typeName: body.typeName ?? "ApiResponse",
      });
    }

    return NextResponse.json({ report, markdown, codegen });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
