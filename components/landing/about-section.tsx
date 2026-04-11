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
              Natural de Vitória/ES e em Goiás desde 2009. Comecei na operação:
              processamento de dados, licitações públicas e monitoramento de radares
              em campo. Foram anos entendendo como sistemas funcionam por dentro,
              antes de começar a construir os meus.
            </p>
            <p>
              Hoje atuo como Design Engineer: desenho e codifico na mesma mão.
              São 13+ anos conectando tecnologia a problema real — de radares e
              infraestrutura crítica em Goiás a produtos digitais com IA, DeFi,
              automação e SaaS. Uso Vibe Coding para manter velocidade sem perder critério.
            </p>
            <p>
              Quando o projeto pede mais, trago parceiros de confiança para
              colaborar. O modelo é enxuto: escopo fechado, entrega contínua e
              produto em produção como prioridade.
            </p>
            <p className="text-foreground font-bold text-xl">
              Meu papel é facilitar. Entender o sistema, acelerar o ciclo e
              colocar para rodar. Produto, protótipo, treinamento ou operação.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
