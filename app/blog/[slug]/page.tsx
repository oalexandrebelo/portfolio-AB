import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getAllPosts } from "@/lib/blog";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} | blog.AIAB`,
    description: post.description,
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      {/* Nav */}
      <nav className="mb-10">
        <Link
          href="/blog"
          className="font-offbit text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="text-primary">&gt;</span> voltar ao blog
        </Link>
      </nav>

      {/* Header */}
      <header className="mb-8">
        {/* Traffic light dots */}
        <div className="flex items-center gap-1.5 mb-6">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#FF5A50]" />
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#FFB53B]" />
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary" />
        </div>

        <h1 className="font-offbit text-2xl sm:text-3xl md:text-4xl text-foreground leading-tight">
          <span className="text-primary">&gt;</span> {post.title}
        </h1>
        <p className="text-muted-foreground text-sm mt-3">
          {post.date} &middot; {post.readingTime}
        </p>
      </header>

      {/* Content box */}
      <article className="border border-foreground/20 border-b-8 border-b-primary rounded-lg p-6 md:p-8 space-y-6">
        {/* --- Article: Pixel Agents --- */}
        {slug === "pixel-agents" && <PixelAgentsContent />}
      </article>

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-border/50">
        <p className="text-muted-foreground text-sm">
          Escrito por{" "}
          <span className="text-foreground font-medium">Alexandre Belo</span>{" "}
          &middot; AI-Augmented Product Engineer
        </p>
        <Link
          href="/blog"
          className="inline-block mt-3 font-offbit text-sm text-primary hover:underline"
        >
          &larr; todos os artigos
        </Link>
      </footer>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Static article content (will be replaced by MDX later)             */
/* ------------------------------------------------------------------ */

function PixelAgentsContent() {
  return (
    <>
      <p className="text-foreground/90 leading-relaxed">
        Imagine ter um colega de equipe que nunca dorme, entende contexto
        complexo e consegue transformar uma descricao em portugues em codigo
        funcional em menos de uma hora. Nao e ficcao: sao os{" "}
        <strong className="text-foreground">pixel agents</strong> &mdash;
        agentes de IA especializados em construir software junto com voce,
        pixel por pixel, funcao por funcao.
      </p>

      <h2 className="font-offbit text-xl sm:text-2xl text-foreground pt-4">
        O que sao agentes de IA para codigo?
      </h2>
      <p className="text-foreground/90 leading-relaxed">
        Ferramentas como Claude Code, Cursor e GitHub Copilot evoluiram de
        simples autocompleters para agentes autonomos. Eles leem seu
        repositorio inteiro, entendem a arquitetura, criam branches, escrevem
        testes e fazem deploy &mdash; tudo a partir de uma instrucao em
        linguagem natural. A diferenca entre um copilot e um agent e
        autonomia: o copilot sugere, o agent executa.
      </p>

      <h2 className="font-offbit text-xl sm:text-2xl text-foreground pt-4">
        Vibe Coding na pratica
      </h2>
      <p className="text-foreground/90 leading-relaxed">
        O termo &quot;vibe coding&quot; captura a essencia: voce descreve a
        vibe do que quer, e o agente traduz isso em implementacao real. Nao e
        sobre perder controle &mdash; e sobre operar em um nivel de abstracao
        mais alto. Voce pensa em produto, o agente pensa em sintaxe.
      </p>

      {/* Code block */}
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border/50">
          <span className="inline-block w-2 h-2 rounded-full bg-[#FF5A50]" />
          <span className="inline-block w-2 h-2 rounded-full bg-[#FFB53B]" />
          <span className="inline-block w-2 h-2 rounded-full bg-primary" />
          <span className="ml-2 text-muted-foreground text-xs font-code">
            agent.ts
          </span>
        </div>
        <pre className="font-code text-sm p-4 overflow-x-auto leading-relaxed">
          <code>
            {`const agent = await claude.code({
  task: "Criar API de autenticacao",
  stack: ["Next.js", "Supabase"],
  constraints: ["LGPD compliant", "JWT + refresh token"]
});
// 47 minutos depois: API rodando com testes`}
          </code>
        </pre>
      </div>

      <h2 className="font-offbit text-xl sm:text-2xl text-foreground pt-4">
        Por que isso muda tudo
      </h2>
      <p className="text-foreground/90 leading-relaxed">
        Quando o custo de implementar cai drasticamente, a barreira deixa de
        ser &quot;consigo programar isso?&quot; e passa a ser &quot;vale a
        pena construir isso?&quot;. Product thinking vira o gargalo, nao
        engineering. Para quem ja pensa em produto primeiro &mdash; como eu
        &mdash; isso e um superpoder. O foco muda de digitar codigo para
        tomar decisoes melhores, mais rapido.
      </p>
      <p className="text-foreground/90 leading-relaxed">
        Estamos no comeco. Mas os pixel agents ja estao aqui, e quem aprender
        a trabalhar com eles agora vai ter uma vantagem desproporcional nos
        proximos anos.
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 pt-4">
        {["IA", "vibe-coding", "agents", "produto"].map((tag) => (
          <span
            key={tag}
            className="font-offbit text-xs text-primary border border-primary/30 rounded px-2 py-0.5"
          >
            #{tag}
          </span>
        ))}
      </div>
    </>
  );
}
