"use client";

import { useEffect, useRef, useState } from "react";
import { Code1, Setting4, Teacher, TrendUp } from "iconsax-react";
import { ParticleCanvas } from "./particle-canvas";

const services = [
  {
    number: "01",
    icon: Code1,
    title: "Produtos digitais de ponta a ponta",
    description:
      "Do conceito ao deploy. Interface, backend, IA integrada. Web, PWA, mobile. Sem handoff, sem estimativa de horas. Entrega real.",
    accent: "rgba(115, 191, 191, 0.15)",
    iconColor: "#73BFBF",
    wide: true,
  },
  {
    number: "02",
    icon: Setting4,
    title: "Automacao e IA aplicada a operacao",
    description:
      "n8n, WhatsApp, CRM, OCR, scraping, agentes IA. Workflows que eliminam retrabalho e conectam sistemas que nao conversam.",
    accent: "rgba(232, 85, 58, 0.12)",
    iconColor: "#E8553A",
    wide: false,
  },
  {
    number: "03",
    icon: Teacher,
    title: "Treinamento de IA para time que executa",
    description:
      "Treinamento pratico. Vibe Coding, prompts avancados, agentes, automacao. O time sai produzindo — nao assistindo palestra.",
    accent: "rgba(115, 191, 191, 0.12)",
    iconColor: "#73BFBF",
    wide: false,
  },
  {
    number: "04",
    icon: TrendUp,
    title: "Growth & Posicionamento Digital",
    description:
      "LP, identidade visual, trafego pago, Google Analytics, SEO tecnico, Growth Marketing. Tudo que uma operacao precisa para estar melhor posicionada no mercado.",
    accent: "rgba(232, 85, 58, 0.15)",
    iconColor: "#E8553A",
    wide: false,
  },
];

export function ServicesSection() {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="servicos" ref={ref} className="py-32 lg:py-40 border-t border-border/50">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-20">
          <span className="inline-flex items-center gap-3 font-offbit text-base lg:text-lg text-accent tracking-wider uppercase mb-6">
            <span className="w-12 h-px bg-accent/50" />
            O que eu construo
          </span>
          <h2 className="text-4xl lg:text-6xl font-black leading-tight max-w-3xl">
            Tres frentes. Um objetivo: <span className="text-primary">colocar para rodar.</span>
          </h2>
        </div>

        {/* Bento grid: 1 wide + 2 normal */}
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
                {/* Particle canvas background */}
                <ParticleCanvas color={s.accent} density={s.wide ? 50 : 30} />

                {/* Content */}
                <div className="relative z-10">
                  <div className={`flex ${s.wide ? "flex-row items-start gap-8" : "flex-col"}`}>
                    {/* Number + Icon */}
                    <div className="flex items-center gap-4 mb-6">
                      <span className="font-offbit text-3xl lg:text-4xl font-bold text-accent leading-none">
                        {s.number}.
                      </span>
                      <div className="w-16 h-16 rounded-2xl bg-foreground/5 border border-border/30 flex items-center justify-center group-hover:border-primary/30 transition-colors">
                        <Icon
                          size={28}
                          color={s.iconColor}
                          variant="Bulk"
                        />
                      </div>
                    </div>

                    {/* Text */}
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

                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
