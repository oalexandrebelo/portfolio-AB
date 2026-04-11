"use client";

import { useInView } from "@/hooks/use-in-view";

export function AboutSection() {
  const { ref, isVisible } = useInView(0.2);

  return (
    <section id="sobre" ref={ref} className="py-32 lg:py-40 border-t border-border/50">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-16 lg:gap-24">
          <div>
            <span className="inline-flex items-center gap-3 font-offbit text-base lg:text-lg text-accent tracking-wider uppercase mb-6">
              <span className="w-12 h-px bg-accent/50" />
              Sobre
            </span>
            <h2 className="text-4xl lg:text-5xl font-black leading-tight">
              Alexandre<br />Belo
            </h2>
          </div>

          <div className={`space-y-6 text-lg text-muted-foreground leading-relaxed transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <p>
              Natural de Vitória/ES e em Goiás desde 2009, comecei na operação:
              processamento de dados, licitações e monitoramento de radares em campo.
              Foram anos entendendo como sistemas funcionam por dentro antes de construir os meus.
            </p>
            <p>
              Hoje, esse conhecimento vira produto. São 13+ anos conectando tecnologia
              a problema real: de radares em Goiás a produtos com IA, DeFi e automação.
            </p>
            <p className="text-foreground font-bold text-xl">
              Meu papel é facilitar. Disponho do que aprendi para acelerar,
              otimizar e criar. Produto, protótipo, treinamento ou operação:
              a lógica é a mesma, entender o sistema e colocar para rodar.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
