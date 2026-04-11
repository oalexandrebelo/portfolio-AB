"use client";

import { useEffect, useRef, useState } from "react";
import { MessageQuestion, Code1, Setting4, Verify } from "iconsax-react";

const steps = [
  {
    number: "I",
    icon: MessageQuestion,
    title: "Diagnóstico direto",
    description: "Uma conversa sobre o que precisa existir. Sem brief de 40 páginas.",
    code: `// diagnostico.ts
const projeto = {
  problema: "Equipe perde 12h/semana em tarefas manuais",
  objetivo: "Automatizar fluxo com IA aplicada",
  prazo: "3 semanas",
  prioridade: "cortar retrabalho"
};`,
  },
  {
    number: "II",
    icon: Code1,
    title: "Build com IA",
    description: "IA como co-piloto. Interface, backend e integração em paralelo.",
    code: `// build.ts
const sprint = await construirProduto({
  interface: true,
  backend: true,
  integracoes: true,
  entrega: "MVP funcional",
  foco: "reduzir ciclo sem perder qualidade"
});`,
  },
  {
    number: "III",
    icon: Setting4,
    title: "Integrar e conectar",
    description: "Sistemas, mensagens, dashboards e webhooks. Dados reais, operação real.",
    code: `// automacao.ts
const fluxo = conectarOperacao({
  entrada: "formulario ou mensagem",
  classificacao: "regras + IA",
  destino: "CRM e base de dados",
  alerta: "time em tempo real"
});`,
  },
  {
    number: "IV",
    icon: Verify,
    title: "Deploy e monitoramento",
    description: "Produto em produção com URL e usuário real. Monitorado.",
    code: `// deploy.ts
const resultado = {
  url: "https://produto.com.br",
  status: "em produção",
  usuarios: "reais",
  acompanhamento: "ativo",
  proximo: "iterar com dados reais"
};

console.log("Rodando.");`,
  },
];

export function HowItWorksSection() {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <section
      id="como-funciona"
      ref={ref}
      className="py-32 lg:py-40 border-t border-border/50 bg-foreground text-background relative"
    >
      <div className="absolute inset-0 diagonal-stripes pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
        <div className="mb-16">
          <span className="inline-flex items-center gap-3 font-offbit text-base lg:text-lg text-background/50 tracking-wider uppercase mb-6">
            <span className="w-12 h-px bg-background/30" />
            Como funciona
          </span>
          <h2 className="text-4xl lg:text-5xl font-black leading-tight">
            Do problema ao produto. Sem rodeio.
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          <div className="space-y-0">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = activeStep === i;
              return (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className={`w-full text-left py-8 border-b border-background/10 transition-all duration-500 cursor-pointer ${
                    isActive ? "opacity-100" : "opacity-40 hover:opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-6">
                    <div className="flex items-center gap-4">
                      <span className="font-offbit text-2xl lg:text-3xl text-background/30">{step.number}</span>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isActive ? "bg-background/20" : "bg-background/5"}`}>
                        <Icon size={22} color={isActive ? "#ffffff" : "rgba(255,255,255,0.4)"} variant="Bulk" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl lg:text-2xl font-bold mb-2">{step.title}</h3>
                      <p className="text-background/50 leading-relaxed">{step.description}</p>
                      {isActive && (
                        <div className="mt-4 h-0.5 bg-background/10 rounded-full overflow-hidden">
                          <div className="h-full bg-background/40 rounded-full animate-[progress-fill_5s_linear_forwards]" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:sticky lg:top-32 self-start">
            <div className="relative rounded-2xl border border-background/10 overflow-hidden corner-ornament-tr corner-ornament-bl">
              <div className="px-6 py-4 border-b border-background/10 flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-background/20" />
                  <div className="w-3 h-3 rounded-full bg-background/15" />
                  <div className="w-3 h-3 rounded-full bg-background/10" />
                </div>
                <span className="font-offbit text-sm text-background/40">
                  {["diagnostico.ts", "build.ts", "automacao.ts", "deploy.ts"][activeStep]}
                </span>
              </div>

              <div className="p-8 font-code text-sm min-h-[280px] bg-foreground/50">
                <pre className="text-background/70 whitespace-pre-wrap leading-relaxed">
                  {steps[activeStep].code}
                </pre>
              </div>

              <div className="px-6 py-3 border-t border-background/10 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="font-offbit text-sm text-background/40">Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
