import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const MEDIUM_TOKEN = process.env.MEDIUM_API_TOKEN ?? "";

/** POST /api/blog/medium — cross-post to Medium */
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  if (!MEDIUM_TOKEN) {
    return NextResponse.json({ error: "MEDIUM_API_TOKEN not configured" }, { status: 500 });
  }

  const { postId } = await req.json();
  if (!postId) {
    return NextResponse.json({ error: "postId required" }, { status: 400 });
  }

  // Get post from DB
  const { data: post, error } = await supabaseAdmin
    .from("blog_posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (error || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  try {
    // 1. Get Medium user ID
    const meRes = await fetch("https://api.medium.com/v1/me", {
      headers: { Authorization: `Bearer ${MEDIUM_TOKEN}` },
    });
    const meData = await meRes.json();
    const userId = meData.data?.id;

    if (!userId) {
      return NextResponse.json({ error: "Could not get Medium user" }, { status: 500 });
    }

    // 2. Create post on Medium
    const mediumRes = await fetch(`https://api.medium.com/v1/users/${userId}/posts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MEDIUM_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: post.title,
        contentFormat: "markdown",
        content: `# ${post.title}\n\n${post.content}\n\n---\n*Publicado originalmente em [alexandrebelo.com.br](https://alexandrebelo.com.br/blog/${post.slug})*`,
        tags: post.tags?.slice(0, 5) ?? [],
        canonicalUrl: `https://alexandrebelo.com.br/blog/${post.slug}`,
        publishStatus: "public",
      }),
    });

    const mediumData = await mediumRes.json();

    if (!mediumRes.ok) {
      return NextResponse.json({ error: mediumData }, { status: 500 });
    }

    const mediumUrl = mediumData.data?.url;

    // 3. Save Medium URL back to post
    if (mediumUrl) {
      await supabaseAdmin
        .from("blog_posts")
        .update({ medium_url: mediumUrl })
        .eq("id", postId);
    }

    return NextResponse.json({ url: mediumUrl, mediumId: mediumData.data?.id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
