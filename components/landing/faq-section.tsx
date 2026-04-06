"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Voce entra so no front-end?",
    answer:
      "Nao. Eu entro quando o produto precisa sair do papel inteiro: interface, codigo, integracao, IA aplicada e colocacao em producao.",
  },
  {
    question: "Voce pega produto do zero ou melhora produto existente?",
    answer:
      "Os dois. Posso entrar do conceito ao primeiro deploy ou em produto que ja roda e precisa de clareza, velocidade e estrutura.",
  },
  {
    question: "Quando faz sentido usar IA?",
    answer:
      "Quando ela reduz ciclo, melhora operacao ou destrava capacidade do produto. Nao uso IA como ornamento.",
  },
  {
    question: "Voce tambem treina time?",
    answer:
      "Sim. Principalmente em fluxo pratico de uso de IA, Vibe Coding, agentes e automacao. O foco e o time produzir melhor, nao assistir palestra.",
  },
  {
    question: "Monitoramento e smart cities seguem ativos?",
    answer:
      "Sim. E uma vertical real de servico, nao uma memoria antiga no portfolio. Sao 13+ anos de operacao em campo.",
  },
  {
    question: "Voce faz LP e identidade visual?",
    answer:
      "Sim. LP, branding, trafego pago, Google Analytics, SEO tecnico. Posicionamento digital completo para operacoes que precisam estar melhor posicionadas no mercado.",
  },
  {
    question: "Como funciona o monitoramento tecnico?",
    answer:
      "Zabbix coleta e mapeia. Grafana exibe com dashboards customizados. API propria para converter protocolos SNMP de dispositivos como lacos indutivos, cameras panoramicas e displays de lombada. Projeto de campo, nao de PowerPoint.",
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
