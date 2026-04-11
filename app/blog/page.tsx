import AsciiTitle from "@/components/blog/ascii-title";
import ArticleCard from "@/components/blog/article-card";
import { getAllPosts, formatDate } from "@/lib/blog";

export const revalidate = 60; // ISR: revalidate every 60s

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <main className="max-w-2xl mx-auto px-4 py-4">
      {/* Header — por: @alexandrebelo */}
      <header className="px-4 pt-6">
        <a
          href="https://instagram.com/alexandrebelo"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground font-code text-sm transition-colors"
        >
          por: @alexandrebelo
        </a>
      </header>

      {/* ASCII title — BLOG.AI */}
      <AsciiTitle />

      {/* Article list */}
      <section className="flex flex-col gap-0 px-4">
        {posts.map((post, i) => (
          <ArticleCard
            key={post.slug}
            number={String(posts.length - i).padStart(2, "0")}
            title={post.title}
            slug={post.slug}
            date={post.published_at ? formatDate(post.published_at) : ""}
          />
        ))}

        {posts.length === 0 && (
          <p className="text-muted-foreground font-code text-sm py-12 text-center">
            Nenhum artigo publicado ainda.
          </p>
        )}
      </section>
    </main>
  );
}
