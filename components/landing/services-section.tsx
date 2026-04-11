"use client";

import { Code1, Setting4, Teacher, TrendUp } from "iconsax-react";
import { useInView } from "@/hooks/use-in-view";
import { ParticleCanvas } from "./particle-canvas";

const services = [
  {
    number: "01",
    icon: Code1,
    title: "Produtos digitais de ponta a ponta",
    description:
      "Do conceito ao deploy. Interface, backend, IA integrada. Web, PWA, mobile. Sem handoff, sem estimativa de horas. Entrega real.",
    accent: "oklch(0.72 0.08 185 / 0.15)",
    iconColor: "oklch(0.72 0.08 185)",
    wide: true,
  },
  {
    number: "02",
    icon: Setting4,
    title: "Automação e IA aplicada à operação",
    description:
      "Workflows que conectam sistemas e eliminam retrabalho manual. Automação aplicada ao que hoje trava a operação.",
    accent: "oklch(0.67 0.18 25 / 0.12)",
    iconColor: "oklch(0.67 0.18 25)",
    wide: false,
  },
  {
    number: "03",
    icon: Teacher,
    title: "Treinamento de IA para time que executa",
    description:
      "Treinamento prático. Vibe Coding, prompts avançados, agentes, automação. O time sai produzindo, não assistindo palestra.",
    accent: "oklch(0.72 0.08 185 / 0.12)",
    iconColor: "oklch(0.72 0.08 185)",
    wide: false,
  },
  {
    number: "04",
    icon: TrendUp,
    title: "Posicionamento digital",
    description:
      "LP, identidade visual, tráfego pago, SEO técnico e medição. Tudo que uma operação precisa para aparecer no lugar certo.",
    accent: "oklch(0.67 0.18 25 / 0.12)",
    iconColor: "oklch(0.67 0.18 25)",
    wide: false,
  },
];

export function ServicesSection() {
  const { ref, isVisible } = useInView(0.1);

  return (
    <section id="servicos" ref={ref} className="py-32 lg:py-40 border-t border-border/50">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-20">
          <span className="inline-flex items-center gap-3 font-offbit text-base lg:text-lg text-accent tracking-wider uppercase mb-6">
            <span className="w-12 h-px bg-accent/50" />
            O que eu entrego
          </span>
          <h2 className="text-4xl lg:text-6xl font-black leading-tight max-w-3xl">
            Três frentes. Um objetivo: <span className="text-primary">colocar para rodar.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {services.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.number}
                className={`group relative overflow-hidden rounded-2xl border border-border/50 p-8 lg:p-10 hover:border-primary/30 transition-all duration-700 ${
                  s.wide ? "md:col-span-2" : ""
                } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                <ParticleCanvas color={s.accent} density={s.wide ? 50 : 30} />

                <div className="relative z-10">
                  <div className={`flex ${s.wide ? "flex-row items-start gap-8" : "flex-col"}`}>
                    <div className="flex items-center gap-4 mb-6">
                      <span className="font-offbit text-3xl lg:text-4xl font-bold text-accent leading-none">
                        {s.number}.
                      </span>
                      <div className="w-16 h-16 rounded-2xl bg-foreground/5 border border-border/30 flex items-center justify-center group-hover:border-primary/30 transition-colors">
                        <Icon size={28} color={s.iconColor} variant="Bulk" />
                      </div>
                    </div>

                    <div className={s.wide ? "flex-1" : ""}>
                      <h3 className="text-xl lg:text-2xl font-bold mb-4 leading-tight">
                        {s.title}
                      </h3>
                      <p className={`text-muted-foreground leading-relaxed text-base ${s.wide ? "max-w-2xl" : ""}`}>
                        {s.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
