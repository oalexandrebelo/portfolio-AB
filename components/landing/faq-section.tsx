"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Você entra só no front-end?",
    answer:
      "Não. Eu entro quando o produto precisa sair do papel inteiro: interface, código, integração, IA aplicada e colocação em produção.",
  },
  {
    question: "Você pega produto do zero ou melhora produto existente?",
    answer:
      "Os dois. Posso entrar do conceito ao primeiro deploy ou em produto que já roda e precisa de clareza, velocidade e estrutura.",
  },
  {
    question: "Quando faz sentido usar IA?",
    answer:
      "Quando ela reduz ciclo, melhora operação ou destrava capacidade do produto. Não uso IA como ornamento.",
  },
  {
    question: "Você também treina time?",
    answer:
      "Sim. Principalmente em fluxo prático de uso de IA, Vibe Coding, agentes e automação. O foco é o time produzir melhor, não assistir palestra.",
  },
  {
    question: "Monitoramento e smart cities seguem ativos?",
    answer:
      "Sim. É uma vertical real de serviço com 13+ anos de operação em campo. Coleta via SNMP, dashboards personalizados e API própria para dispositivos não padrão.",
  },
  {
    question: "Você faz LP e identidade visual?",
    answer:
      "Sim. LP, identidade visual, tráfego pago, Google Analytics e SEO técnico. Posicionamento digital para operações que precisam aparecer melhor e comunicar com mais clareza.",
  },
  {
    question: "Como funciona o monitoramento técnico?",
    answer:
      "Coleta automatizada via protocolo SNMP mapeia cada dispositivo. Dashboards personalizados exibem dados em tempo real. API própria converte protocolos de equipamentos como laços indutivos, câmeras e displays de lombada. Projeto de campo, não de PowerPoint.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="py-32 lg:py-40 border-t border-border/50">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-16 lg:gap-24">
          <div>
            <span className="inline-flex items-center gap-3 font-offbit text-base lg:text-lg text-accent tracking-wider uppercase mb-6">
              <span className="w-12 h-px bg-accent/50" />
              FAQ
            </span>
            <h2 className="text-4xl lg:text-5xl font-black leading-tight">
              Perguntas<br />frequentes
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border/50">
                <AccordionTrigger className="text-left text-lg font-medium hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
