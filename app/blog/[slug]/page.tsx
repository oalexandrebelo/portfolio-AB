import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getAllPosts, formatDate } from "@/lib/blog";
import { NewsletterForm } from "@/components/blog/newsletter-form";
import { MarkdownRenderer } from "@/components/blog/markdown-renderer";
import type { Metadata } from "next";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} | blog.AIAB`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      authors: ["Alexandre Belo"],
    },
    twitter: {
      card: "summary",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const publishedDate = post.published_at ? formatDate(post.published_at) : "";

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      {/* Nav */}
      <nav className="mb-10">
        <Link
          href="/blog"
          className="font-code text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="text-primary">&gt;</span> voltar ao blog
        </Link>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-1.5 mb-6">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#FF5A50]" />
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#FFB53B]" />
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary" />
        </div>

        <h1 className="font-offbit font-bold text-2xl sm:text-3xl md:text-4xl text-foreground leading-tight">
          <span className="text-primary">&gt;</span> {post.title}
        </h1>
        <p className="text-muted-foreground font-code text-sm mt-3">
          {publishedDate} &middot; {post.reading_time}
        </p>
      </header>

      {/* Content box */}
      <article className="border border-foreground/20 border-b-8 border-b-primary rounded-lg p-6 md:p-8 space-y-6">
        <MarkdownRenderer content={post.content} tags={post.tags} />
      </article>

      {/* Newsletter */}
      <NewsletterForm />

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-border/50">
        <p className="text-muted-foreground font-code text-sm">
          Escrito por{" "}
          <span className="text-foreground font-medium">Alexandre Belo</span>{" "}
          &middot; Design Engineer
        </p>
        <Link
          href="/blog"
          className="inline-block mt-3 font-code text-sm text-primary hover:underline"
        >
          &larr; todos os artigos
        </Link>
      </footer>
    </main>
  );
}
