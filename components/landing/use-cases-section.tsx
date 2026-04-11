"use client";

import { Send2, Buildings2, Monitor, CloudConnection, TrendUp } from "iconsax-react";
import { useInView } from "@/hooks/use-in-view";
import { ArrowRight } from "lucide-react";
import { GradientButton } from "./gradient-button";

const useCases = [
  {
    icon: Send2,
    label: "Startups & Founders",
    title: "MVP que precisa sair em semanas",
    points: [
      "Do conceito ao produto rodando",
      "Full-stack com IA integrada",
      "Pricing e deploy inclusos",
    ],
  },
  {
    icon: Buildings2,
    label: "Empresas & Operações",
    title: "Automação que corta retrabalho",
    points: [
      "Workflows que conectam sistemas",
      "Treinamento de IA para o time",
      "Monitoramento de infraestrutura",
    ],
  },
  {
    icon: Monitor,
    label: "Produto existente",
    title: "Produto que precisa de velocidade",
    points: [
      "Refatoração com Vibe Coding",
      "Integração de IA no fluxo",
      "Arquitetura escalável",
    ],
  },
  {
    icon: CloudConnection,
    label: "Smart Cities & IoT",
    title: "Infraestrutura crítica monitorada",
    points: [
      "13+ anos em radares e dados",
      "Dashboards operacionais",
      "Consultoria técnica de campo",
    ],
  },
  {
    icon: TrendUp,
    label: "Posicionamento Digital",
    title: "Sua marca no lugar certo",
    points: [
      "LP e identidade visual",
      "Tráfego pago + GA + SEO técnico",
      "Consultoria de Growth Marketing",
    ],
  },
];

export function UseCasesSection() {
  const { ref, isVisible } = useInView(0.1);

  return (
    <section id="use-cases" ref={ref} className="py-32 lg:py-40 border-t border-border/50">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-20">
          <span className="inline-flex items-center gap-3 font-offbit text-base lg:text-lg text-accent tracking-wider uppercase mb-6">
            <span className="w-12 h-px bg-accent/50" />
            Para quem
          </span>
          <h2 className="text-4xl lg:text-5xl font-black leading-tight max-w-3xl mb-6">
            Cada operação tem um ponto de entrada <span className="text-primary">diferente.</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Produto do zero, automação de operação existente, treinamento de time, monitoramento de infraestrutura ou posicionamento digital.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {useCases.map((uc, i) => {
            const Icon = uc.icon;
            return (
              <div
                key={i}
                className={`group relative rounded-2xl border border-border/50 p-8 lg:p-10 hover:border-primary/30 hover:bg-primary/[0.03] transition-all duration-700 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-border/30 flex items-center justify-center group-hover:border-primary/30 transition-colors">
                      <Icon size={26} color="#73BFBF" variant="Bulk" />
                    </div>
                    <span className="font-offbit text-sm text-accent uppercase tracking-wider">
                      {uc.label}
                    </span>
                  </div>

                  <h3 className="text-xl lg:text-2xl font-bold mb-6">{uc.title}</h3>

                  <ul className="space-y-3">
                    {uc.points.map((point, j) => (
                      <li key={j} className="flex items-center gap-3 text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <GradientButton
            variant="outline"
            onClick={() => document.getElementById("portfolio")?.scrollIntoView({ behavior: "smooth" })}
          >
            Ver projetos reais
            <ArrowRight className="w-4 h-4" />
          </GradientButton>

          <GradientButton href="https://wa.me/5564999271254">
            Falar no WhatsApp
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </GradientButton>
        </div>
      </div>
    </section>
  );
}
