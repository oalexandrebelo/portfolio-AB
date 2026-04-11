import { supabase } from "./supabase";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  reading_time: string;
  status: "draft" | "published";
  medium_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Public: all published posts, newest first */
export async function getAllPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("getAllPosts error:", error);
    return [];
  }
  return data ?? [];
}

/** Public: single published post by slug */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) return null;
  return data;
}

/** Admin: all posts (drafts + published) */
export async function getAllPostsAdmin(adminKey: string): Promise<BlogPost[]> {
  const res = await fetch("/api/blog/posts", {
    headers: { "x-admin-key": adminKey },
  });
  if (!res.ok) return [];
  return res.json();
}

/** Estimate reading time from markdown content */
export function estimateReadingTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min de leitura`;
}

/** Generate slug from title */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Format date for display */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
