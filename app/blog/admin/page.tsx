"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, PenLine, Trash2, Eye, Send, Lock } from "lucide-react";
import type { BlogPost } from "@/lib/blog";

export default function BlogAdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/blog/posts", {
      headers: { "x-admin-key": adminKey },
    });
    if (res.ok) {
      const data = await res.json();
      setPosts(data);
      setAuthenticated(true);
    } else {
      setAuthenticated(false);
    }
    setLoading(false);
  }, [adminKey]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchPosts();
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Deletar "${title}"?`)) return;
    await fetch(`/api/blog/posts/${id}`, {
      method: "DELETE",
      headers: { "x-admin-key": adminKey },
    });
    fetchPosts();
  };

  const handleMedium = async (id: string) => {
    const res = await fetch("/api/blog/medium", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body: JSON.stringify({ postId: id }),
    });
    const data = await res.json();
    if (data.url) {
      alert(`Publicado no Medium: ${data.url}`);
      fetchPosts();
    } else {
      alert(`Erro: ${JSON.stringify(data.error)}`);
    }
  };

  if (!authenticated) {
    return (
      <main className="max-w-md mx-auto px-4 py-20">
        <div className="border border-border/50 rounded-2xl p-8 bg-card">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lock size={20} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Blog Admin</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Admin key"
              className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-foreground font-code text-sm focus:outline-none focus:border-primary/50 transition-colors"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-primary text-background font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Entrar"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-1">Blog Admin</h1>
          <p className="text-muted-foreground font-code text-sm">
            {posts.length} posts · {posts.filter((p) => p.status === "published").length} publicados
          </p>
        </div>
        <Link
          href="/blog/admin/new"
          className="flex items-center gap-2 px-5 py-3 bg-primary text-background font-bold rounded-xl hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          Novo Post
        </Link>
      </div>

      {/* Posts list */}
      <div className="space-y-3">
        {posts.map((post) => (
          <div
            key={post.id}
            className="flex items-center gap-4 border border-border/50 rounded-xl p-5 bg-card hover:border-primary/30 transition-colors"
          >
            {/* Status dot */}
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                post.status === "published" ? "bg-green-500" : "bg-yellow-500"
              }`}
              title={post.status}
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground truncate">{post.title}</h3>
              <p className="text-muted-foreground font-code text-xs mt-1">
                /{post.slug} · {post.reading_time}
                {post.tags?.length > 0 && (
                  <> · {post.tags.map((t) => `#${t}`).join(" ")}</>
                )}
                {post.medium_url && (
                  <> · <a href={post.medium_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Medium ↗</a></>
                )}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {post.status === "published" && (
                <a
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-foreground/5"
                  title="Ver publicado"
                >
                  <Eye size={16} />
                </a>
              )}
              {post.status === "published" && !post.medium_url && (
                <button
                  onClick={() => handleMedium(post.id)}
                  className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-primary/5"
                  title="Publicar no Medium"
                >
                  <Send size={16} />
                </button>
              )}
              <Link
                href={`/blog/admin/${post.id}?key=${encodeURIComponent(adminKey)}`}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-foreground/5"
                title="Editar"
              >
                <PenLine size={16} />
              </Link>
              <button
                onClick={() => handleDelete(post.id, post.title)}
                className="p-2 text-muted-foreground hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/5"
                title="Deletar"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg mb-2">Nenhum post ainda</p>
            <p className="font-code text-sm">Clique em &quot;Novo Post&quot; para começar</p>
          </div>
        )}
      </div>
    </main>
  );
}
