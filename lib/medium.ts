/**
 * Medium API Integration
 * Endpoint: POST https://api.medium.com/v1/users/{userId}/posts
 * Auth: Integration token (Bearer)
 *
 * Usage: await publishToMedium(article)
 * Status: Structure ready, requires MEDIUM_TOKEN env var to activate
 */

interface MediumArticle {
  title: string;
  content: string; // HTML content
  contentFormat: "html" | "markdown";
  tags?: string[];
  publishStatus?: "public" | "draft" | "unlisted";
  canonicalUrl?: string; // Link back to blog.AIAB
}

interface MediumResponse {
  data: {
    id: string;
    title: string;
    url: string;
    publishStatus: string;
  };
}

export async function getMediumUserId(token: string): Promise<string> {
  const res = await fetch("https://api.medium.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.data.id;
}

export async function publishToMedium(
  article: MediumArticle
): Promise<MediumResponse | null> {
  const token = process.env.MEDIUM_TOKEN;
  if (!token) {
    console.warn("[Medium] MEDIUM_TOKEN not set. Skipping publish.");
    return null;
  }

  const userId = await getMediumUserId(token);

  const res = await fetch(
    `https://api.medium.com/v1/users/${userId}/posts`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: article.title,
        contentFormat: article.contentFormat,
        content: article.content,
        tags: article.tags || [],
        publishStatus: article.publishStatus || "draft",
        canonicalUrl: article.canonicalUrl,
      }),
    }
  );

  return res.json();
}

// Helper: Convert blog post to Medium-ready format
export function prepareMediumArticle(post: {
  title: string;
  htmlContent: string;
  slug: string;
  tags?: string[];
}): MediumArticle {
  return {
    title: post.title,
    content: post.htmlContent,
    contentFormat: "html",
    tags: post.tags || ["IA", "vibe-coding", "automacao"],
    publishStatus: "draft", // Always draft first
    canonicalUrl: `https://alexandrebelo.com.br/blog/${post.slug}`,
  };
}
