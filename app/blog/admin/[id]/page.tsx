"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Eye, EyeOff, Send, Globe } from "lucide-react";
import { slugify, estimateReadingTime } from "@/lib/blog";
import type { BlogPost } from "@/lib/blog";

export default function BlogEditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isNew = params.id === "new";
  const adminKey = searchParams.get("key") ?? "";

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [mediumUrl, setMediumUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [postId, setPostId] = useState<string | null>(isNew ? null : (params.id as string));
  const [autoSlug, setAutoSlug] = useState(true);

  // Load existing post
  useEffect(() => {
    if (isNew || !adminKey) return;
    fetch(`/api/blog/posts/${params.id}`, {
      headers: { "x-admin-key": adminKey },
    })
      .then((r) => r.json())
      .then((post: BlogPost) => {
        setTitle(post.title);
        setSlug(post.slug);
        setDescription(post.description);
        setContent(post.content);
        setTags(post.tags?.join(", ") ?? "");
        setStatus(post.status);
        setMediumUrl(post.medium_url);
        setAutoSlug(false);
      });
  }, [isNew, params.id, adminKey]);

  // Auto-generate slug from title
  useEffect(() => {
    if (autoSlug && title) {
      setSlug(slugify(title));
    }
  }, [title, autoSlug]);

  const handleSave = async (publishStatus?: "draft" | "published") => {
    setSaving(true);
    const finalStatus = publishStatus ?? status;
    const readingTime = estimateReadingTime(content);
    const tagArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const body = {
      slug,
      title,
      description,
      content,
      tags: tagArray,
      reading_time: readingTime,
      status: finalStatus,
    };

    let res: Response;
    if (postId) {
      // Update
      res = await fetch(`/api/blog/posts/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify(body),
      });
    } else {
      // Create
      res = await fetch("/api/blog/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify(body),
      });
    }

    if (res.ok) {
      const data = await res.json();
      if (!postId) {
        setPostId(data.id);
        // Update URL without reload
        window.history.replaceState(null, "", `/blog/admin/${data.id}?key=${encodeURIComponent(adminKey)}`);
      }
      setStatus(finalStatus);
    }
    setSaving(false);
  };

  const handleMedium = async () => {
    if (!postId) return;
    const res = await fetch("/api/blog/medium", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body: JSON.stringify({ postId }),
    });
    const data = await res.json();
    if (data.url) {
      setMediumUrl(data.url);
      alert(`Publicado no Medium: ${data.url}`);
    } else {
      alert(`Erro: ${JSON.stringify(data.error)}`);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href={`/blog/admin?key=${encodeURIComponent(adminKey)}`}
          onClick={(e) => {
            e.preventDefault();
            router.push("/blog/admin");
          }}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-code text-sm"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>

        <div className="flex items-center gap-3">
          {/* Preview toggle */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 border border-border/50 rounded-xl text-sm font-medium hover:bg-foreground/5 transition-colors"
          >
            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPreview ? "Editor" : "Preview"}
          </button>

          {/* Save draft */}
          <button
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border border-border/50 rounded-xl text-sm font-medium hover:bg-foreground/5 transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            Salvar rascunho
          </button>

          {/* Publish */}
          <button
            onClick={() => handleSave("published")}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-background font-bold rounded-xl hover:bg-primary/90 transition-colors text-sm disabled:opacity-50"
          >
            <Globe size={14} />
            {status === "published" ? "Atualizar" : "Publicar"}
          </button>

          {/* Medium */}
          {postId && status === "published" && !mediumUrl && (
            <button
              onClick={handleMedium}
              className="flex items-center gap-2 px-4 py-2 bg-[#242424] text-white rounded-xl text-sm font-medium hover:bg-[#333] transition-colors"
            >
              <Send size={14} />
              Medium
            </button>
          )}
          {mediumUrl && (
            <a
              href={mediumUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-code text-xs hover:underline"
            >
              Medium ↗
            </a>
          )}
        </div>
      </div>

      {showPreview ? (
        /* ─── PREVIEW ─── */
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-1.5 mb-6">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#FF5A50]" />
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#FFB53B]" />
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary" />
            </div>
            <h1 className="font-offbit font-bold text-3xl md:text-4xl text-foreground leading-tight">
              <span className="text-primary">&gt;</span> {title || "Sem título"}
            </h1>
            <p className="text-muted-foreground font-code text-sm mt-3">
              {estimateReadingTime(content)}
            </p>
          </div>
          <article className="border border-foreground/20 border-b-8 border-b-primary rounded-lg p-6 md:p-8">
            <div
              className="prose prose-invert prose-headings:font-offbit prose-headings:font-bold prose-code:font-code max-w-none text-foreground/90 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
            />
          </article>
        </div>
      ) : (
        /* ─── EDITOR ─── */
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Main editor */}
          <div className="space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do post"
              className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder:text-foreground/20"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva em Markdown..."
              className="w-full min-h-[60vh] bg-card border border-border/50 rounded-xl p-6 font-code text-sm text-foreground/90 leading-relaxed resize-y outline-none focus:border-primary/30 transition-colors placeholder:text-foreground/15"
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="border border-border/50 rounded-xl p-5 bg-card space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Metadados</h3>

              <div>
                <label className="block text-xs text-muted-foreground font-code mb-1.5">Slug</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setAutoSlug(false);
                    }}
                    className="flex-1 px-3 py-2 bg-background border border-border/50 rounded-lg font-code text-sm outline-none focus:border-primary/30 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground font-code mb-1.5">Descrição (SEO)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg font-code text-sm outline-none focus:border-primary/30 transition-colors resize-none"
                  placeholder="Breve descrição para SEO e cards"
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground font-code mb-1.5">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="IA, vibe-coding, produto"
                  className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg font-code text-sm outline-none focus:border-primary/30 transition-colors"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {tags.split(",").filter(t => t.trim()).map((tag) => (
                  <span key={tag.trim()} className="font-code text-xs text-primary border border-primary/30 rounded px-2 py-0.5">
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Status info */}
            <div className="border border-border/50 rounded-xl p-5 bg-card space-y-3">
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Status</h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status === "published" ? "bg-green-500" : "bg-yellow-500"}`} />
                <span className="font-code text-sm">{status === "published" ? "Publicado" : "Rascunho"}</span>
              </div>
              <p className="font-code text-xs text-muted-foreground">
                {estimateReadingTime(content)} · {content.trim().split(/\s+/).length} palavras
              </p>
            </div>

            {/* Markdown help */}
            <div className="border border-border/50 rounded-xl p-5 bg-card space-y-2">
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Markdown</h3>
              <div className="font-code text-xs text-muted-foreground space-y-1">
                <p># Título</p>
                <p>## Subtítulo</p>
                <p>**negrito** · *itálico*</p>
                <p>```ts code block ```</p>
                <p>[link](url)</p>
                <p>![alt](image-url)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ─── Simple Markdown → HTML ─── */
function markdownToHtml(md: string): string {
  let html = md
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre class="bg-background border border-border rounded-lg overflow-hidden"><div class="flex items-center gap-1.5 px-4 py-2 border-b border-border/50"><span class="inline-block w-2 h-2 rounded-full bg-[#FF5A50]"></span><span class="inline-block w-2 h-2 rounded-full bg-[#FFB53B]"></span><span class="inline-block w-2 h-2 rounded-full bg-primary"></span><span class="ml-2 text-muted-foreground text-xs font-code">${lang || "code"}</span></div><code class="block p-4 font-code text-sm text-foreground/80 overflow-x-auto">${escapeHtml(code.trim())}</code></pre>`;
    })
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="font-code text-sm bg-primary/10 text-primary px-1.5 py-0.5 rounded">$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="font-offbit font-bold text-lg sm:text-xl text-foreground pt-4">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-offbit font-bold text-xl sm:text-2xl text-foreground pt-4">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-offbit font-bold text-2xl sm:text-3xl text-foreground pt-4">$1</h1>')
    // Bold & italic
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-lg my-4 max-w-full" />')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="border-border/50 my-6" />')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary/50 pl-4 italic text-foreground/70">$1</blockquote>')
    // Unordered list
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-foreground/90">$1</li>')
    // Paragraphs (lines not already wrapped)
    .replace(/^(?!<[huplib]|<hr|<block|<pre|<code)(.+)$/gm, '<p class="text-foreground/90 leading-relaxed">$1</p>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li[^>]*>.*?<\/li>\n?)+)/g, '<ul class="space-y-1 my-2">$1</ul>');

  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
