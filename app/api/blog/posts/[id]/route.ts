import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** GET /api/blog/posts/:id — single post (admin) */
export async function GET(req: NextRequest, ctx: RouteContext) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { id } = await ctx.params;
  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

/** PATCH /api/blog/posts/:id — update post (admin) */
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { id } = await ctx.params;
  const body = await req.json();

  // If publishing for the first time, set published_at
  if (body.status === "published" && !body.published_at) {
    const { data: existing } = await supabaseAdmin
      .from("blog_posts")
      .select("published_at")
      .eq("id", id)
      .single();
    if (!existing?.published_at) {
      body.published_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/** DELETE /api/blog/posts/:id — delete post (admin) */
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { id } = await ctx.params;
  const { error } = await supabaseAdmin
    .from("blog_posts")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
