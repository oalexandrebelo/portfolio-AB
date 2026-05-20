export interface Faq {
  question: string;
  answer: string;
}

// Single source of truth for the FAQ.
// Rendered by components/landing/faq-section.tsx AND emitted as FAQPage
// JSON-LD in app/page.tsx — keeping both in sync (Google requires the
// structured data to match the visible content 1:1).
export const faqs: Faq[] = [
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
