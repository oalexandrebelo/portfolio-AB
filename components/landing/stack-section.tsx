"use client";

import { useInView } from "@/hooks/use-in-view";

const categories = [
  { label: "Frontend", items: ["React", "Next.js", "TypeScript", "Tailwind", "GSAP", "Figma"] },
  { label: "Backend", items: ["Node.js", "FastAPI", "Express", "Supabase", "PostgreSQL", "Redis"] },
  { label: "IA", items: ["GPT-4o", "Claude", "Ollama", "RAG", "Agentes"] },
  { label: "Automacao", items: ["n8n", "Evolution API", "Chatwoot", "WhatsApp"] },
  { label: "Web3", items: ["Solidity", "Foundry", "Circle CCTP", "Wagmi"] },
  { label: "Infra", items: ["Zabbix", "Docker", "Vercel", "Netlify"] },
  { label: "Produto", items: ["Google Analytics", "GTM", "SEO", "Meta Ads", "Growth"] },
];

export function StackSection() {
  const { ref, isVisible } = useInView(0.1);

  return (
    <section id="stack" ref={ref} className="py-32 lg:py-40 border-t border-border/50">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-20">
          <span className="inline-flex items-center gap-3 font-offbit text-base lg:text-lg text-accent tracking-wider uppercase mb-6">
            <span className="w-12 h-px bg-accent/50" />
            Tecnologias
          </span>
          <h2 className="text-4xl lg:text-5xl font-black leading-tight">
            Stack que sustenta <span className="text-primary">produto em producao</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {categories.map((cat, i) => (
            <div
              key={cat.label}
              className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {/* OffBit category label — scaled to text-base */}
              <h3 className="font-offbit text-base text-accent uppercase tracking-wider mb-5">{cat.label}</h3>
              <div className="flex flex-wrap gap-2">
                {cat.items.map((item) => (
                  <span
                    key={item}
                    className="px-4 py-2.5 rounded-full border border-border/50 text-sm text-foreground/80 hover:border-primary/40 hover:text-primary hover:bg-primary/[0.05] transition-all duration-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
