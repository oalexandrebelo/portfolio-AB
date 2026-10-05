import Link from "next/link";
import AsciiTitle from "@/components/blog/ascii-title";
import ArticleCard from "@/components/blog/article-card";
import { getAllPosts, formatDate } from "@/lib/blog";

export const revalidate = 60;

export default async function BlogPage() {
  const posts = await getAllPosts();
  return (
    <main className="max-w-2xl mx-auto px-4 py-4">
      <header className="px-4 pt-6 flex items-center justify-between gap-4">
        <Link href="/" className="text-muted-foreground hover:text-foreground font-code text-sm transition-colors">
          <span className="text-primary">&larr;</span> Alexandre Belo
        </Link>
        <a href="https://instagram.com/alexandrebelo" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground font-code text-sm transition-colors">
          por: @alexandrebelo
        </a>
      </header>
      <AsciiTitle />
      <nav aria-label="Estudos reservados" className="px-4 mb-2 flex justify-end">
        <a href="/estudos" title="Acessar estudos com senha" className="inline-flex min-h-11 items-center px-1 text-muted-foreground hover:text-foreground font-code text-xs transition-colors underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
          Estudos
        </a>
      </nav>
      <section className="flex flex-col gap-0 px-4">
        {posts.map((post, i) => (
          <ArticleCard key={post.slug} number={String(posts.length - i).padStart(2, "0")} title={post.title} slug={post.slug} date={post.published_at ? formatDate(post.published_at) : ""} />
        ))}
        {posts.length === 0 && (
          <p className="text-muted-foreground font-code text-sm py-12 text-center">Nenhum artigo publicado ainda.</p>
        )}
      </section>
    </main>
  );
}
