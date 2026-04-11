"use client";

import { useInView } from "@/hooks/use-in-view";

const metrics = [
  { project: "BBL0CK", result: "4 plataformas em ~43h", detail: "Android, Windows, Chrome, Web" },
  { project: "DoneFit", result: "31 funções científicas + 498 testes", detail: "Engine fisiológica completa com GPT-4" },
  { project: "Precafy", result: "SaaS complexo em ~330h", detail: "309K precatórios, 18 tribunais, CRM" },
  { project: "Nexus Lend", result: "DeFi refatorado em ~146h", detail: "12 chains, Circle CCTP, Solidity" },
];

export function MethodologySection() {
  const { ref, isVisible } = useInView(0.1);

  return (
    <section id="metodologia" ref={ref} className="py-32 lg:py-40 border-t border-border/50">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          <div>
            <span className="inline-flex items-center gap-3 font-offbit text-base lg:text-lg text-accent tracking-wider uppercase mb-6">
              <span className="w-12 h-px bg-accent/50" />
              Como eu executo
            </span>
            <h2 className="text-4xl lg:text-5xl font-black leading-tight mb-8">
              Velocidade com critério. <span className="text-primary">IA no fluxo, não no discurso.</span>
            </h2>
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                IA entra no fluxo para reduzir atrito, acelerar ciclo e tirar
                gargalo técnico. Não para maquiar produto.
              </p>
              <p>
                O foco continua o mesmo: entender o problema, desenhar a solução
                certa e colocar algo rodando com qualidade.
              </p>
              <p className="text-foreground font-bold">
                Escopo e resultado importam mais do que hora avulsa.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {metrics.map((m, i) => (
              <div
                key={m.project}
                className={`group p-6 rounded-2xl border border-border/50 hover:border-primary/30 hover:bg-primary/[0.03] transition-all duration-700 ${
                  isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <span className="font-offbit text-base text-accent uppercase tracking-wider">{m.project}</span>
                <p className="text-xl font-bold mt-2 mb-1">{m.result}</p>
                <p className="text-sm text-muted-foreground">{m.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
