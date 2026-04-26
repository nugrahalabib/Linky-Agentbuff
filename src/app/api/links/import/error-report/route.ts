import { NextResponse } from "next/server";
import { encodeCsv } from "@/lib/csv";
import { getSessionUser } from "@/lib/auth";

interface Issue {
  row: number;
  error: string;
  original?: string;
}

export async function POST(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { issues?: Issue[] } | null;
  const issues = body?.issues ?? [];
  const csv = encodeCsv(
    issues.map((i) => ({ row: i.row, error: i.error, original_data: i.original ?? "" })),
    ["row", "error", "original_data"],
  );
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="linky-import-errors-${date}.csv"`,
    },
  });
}
