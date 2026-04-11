import { NextRequest, NextResponse } from "next/server";

const ADMIN_KEY = process.env.BLOG_ADMIN_KEY ?? "";

export function requireAdmin(req: NextRequest): NextResponse | null {
  const key = req.headers.get("x-admin-key");
  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null; // authenticated
}
