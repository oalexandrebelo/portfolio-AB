import Link from "next/link";
import AsciiTitle from "@/components/blog/ascii-title";
import ArticleCard from "@/components/blog/article-card";
import { getAllPosts } from "@/lib/blog";

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      {/* Back link */}
      <nav className="mb-10">
        <Link
          href="/"
          className="font-offbit text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="text-primary">&gt;</span> voltar ao portfolio
        </Link>
      </nav>

      {/* ASCII title */}
      <header className="mb-12">
        <AsciiTitle />
        <p className="text-muted-foreground text-sm mt-4 max-w-md">
          IA aplicada, automacao, vibe coding e produto digital. Sem hype.
        </p>
      </header>

      {/* Article list */}
      <section className="flex flex-col gap-4">
        {posts.map((post, i) => (
          <ArticleCard
            key={post.slug}
            number={String(i + 1).padStart(2, "0")}
            title={post.title}
            slug={post.slug}
            date={post.date}
          />
        ))}
      </section>
    </main>
  );
}
