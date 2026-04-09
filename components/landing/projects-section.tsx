"use client";

import { ArrowUpRight } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";

const projects = [
  {
    name: "Precafy",
    vertical: "Fintech",
    headline: "Mercado de R$39Bi em precatorios. Indexado e acessivel.",
    proofs: ["309K precatorios", "18 tribunais", "134M registros"],
    stack: "React · Supabase · n8n · OCR · RAG",
    url: "https://precafy.com.br",
  },
  {
    name: "BBL0CK",
    vertical: "Seguranca Digital",
    headline: "50K+ sites de aposta bloqueados. 4 plataformas. 43 horas.",
    proofs: ["MVP em ~43h", "4 plataformas", "Motor de 5 camadas"],
    stack: "Next.js · Kotlin · .NET · Chrome Extension",
    url: "https://bbl0ck.alexandrebelo.com.br",
  },
  {
    name: "DoneFit",
    vertical: "HealthTech",
    headline: "IA que treina com ciencia. 31 funcoes fisiologicas reais.",
    proofs: ["31 funcoes cientificas", "498 testes", "GPT-4o-mini"],
    stack: "React · Supabase · OpenAI · Vercel",
    url: "https://donefit.alexandrebelo.com.br",
  },
  {
    name: "Nexus Lend",
    vertical: "DeFi / Web3",
    headline: "Liquidez DeFi em 12 blockchains. Bridge nativa.",
    proofs: ["12 blockchains", "Circle CCTP", "E-Mode 98% LTV"],
    stack: "Next.js · Solidity · Foundry · Wagmi",
    url: "https://nexuxlend.netlify.app",
  },
  {
    name: "Undoc",
    vertical: "Enterprise AI",
    headline: "BI com IA que nunca sai da sua maquina.",
    proofs: ["Zero cloud", "LGPD compliant", "Ollama air-gapped"],
    stack: "Electron · FastAPI · Ollama · GraphicWalker",
    url: "https://undoc.alexandrebelo.com.br",
  },
  {
    name: "AG Kit Brabo",
    vertical: "Dev Tools",
    headline: "20 agentes IA. Open source. Para quem constroi.",
    proofs: ["20 agentes", "10 skills", "npm package"],
    stack: "Node.js · npm · GitHub Pages",
    url: "https://github.com/oalexandrebelo/Antigravity-Kit-Brabo",
  },
];

export function ProjectsSection() {
  const { ref, isVisible } = useInView(0.05);

  return (
    <section id="portfolio" ref={ref} className="py-32 lg:py-40 border-t border-border/50">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-20">
          <span className="inline-flex items-center gap-3 font-offbit text-base lg:text-lg text-accent tracking-wider uppercase mb-6">
            <span className="w-12 h-px bg-accent/50" />
            Portfolio
          </span>
          <h2 className="text-4xl lg:text-6xl font-black leading-tight max-w-4xl mb-6">
            Produtos que rodam. <span className="text-primary">Nao mockups.</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Cada caso mostra problema, escopo, prova e link real.
          </p>
        </div>

        {/* gap-px trick: bg shows through 1px gaps as borders */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border/50 rounded-2xl overflow-hidden">
          {projects.map((p, i) => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={p.name + " — " + p.headline}
              className={`group relative block bg-background p-8 hover:bg-primary/[0.03] transition-all duration-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  {/* OffBit vertical tag — scaled to text-sm (was text-xs) */}
                  <span className="font-offbit text-sm text-accent uppercase tracking-wider px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5">
                    {p.vertical}
                  </span>
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                <h3 className="text-2xl font-bold mb-2">{p.name}</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">{p.headline}</p>

                {/* OffBit proof badges — scaled to text-sm */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {p.proofs.map((proof) => (
                    <span key={proof} className="font-offbit text-sm bg-primary/10 text-primary px-4 py-2 rounded-lg">
                      {proof}
                    </span>
                  ))}
                </div>

                {/* OffBit stack — scaled to text-sm */}
                <p className="font-offbit text-sm text-muted-foreground">{p.stack}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
