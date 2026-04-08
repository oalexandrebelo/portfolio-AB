import AsciiTitle from "@/components/blog/ascii-title";
import ArticleCard from "@/components/blog/article-card";
import { getAllPosts } from "@/lib/blog";

export default function BlogPage() {
  const posts = getAllPosts();

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
            date={post.date}
          />
        ))}
      </section>
    </main>
  );
}
