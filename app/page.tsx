import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { ServicesSection } from "@/components/landing/services-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { ProjectsSection } from "@/components/landing/projects-section";
import { MethodologySection } from "@/components/landing/methodology-section";
import { UseCasesSection } from "@/components/landing/use-cases-section";
import { MonitoringSection } from "@/components/landing/monitoring-section";
import { StackSection } from "@/components/landing/stack-section";
import { AboutSection } from "@/components/landing/about-section";
import { FaqSection } from "@/components/landing/faq-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { ContactSection } from "@/components/landing/contact-section";
import { FooterSection } from "@/components/landing/footer-section";
import { DotGrid } from "@/components/landing/dot-grid";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden noise-overlay">
      {/* Dot grid canvas — mouse proximity effect */}
      <DotGrid />
      <Navigation />
      <HeroSection />
      <ServicesSection />

      <HowItWorksSection />

      <ProjectsSection />

      <MethodologySection />
      <UseCasesSection />

      <MonitoringSection />
      <StackSection />
      <AboutSection />
      <FaqSection />
      <IntegrationsSection />

      <ContactSection />
      <FooterSection />
      {/* Person Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: "Alexandre Belo",
            jobTitle: "Design Engineer",
            url: "https://alexandrebelo.com.br",
            sameAs: [
              "https://www.linkedin.com/in/alexandrebelo",
              "https://github.com/oalexandrebelo",
            ],
            email: "contato@alexandrebelo.com.br",
            telephone: "+5564999271254",
            address: {
              "@type": "PostalAddress",
              addressRegion: "GO",
              addressCountry: "BR",
            },
            knowsAbout: [
              "Design Engineering",
              "Product Development",
              "AI Integration",
              "Automation",
              "Monitoring",
              "Smart Cities",
              "Growth Marketing",
            ],
          }),
        }}
      />
      {/* FAQ Schema — enables rich snippets in Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Voce entra so no front-end?",
                acceptedAnswer: { "@type": "Answer", text: "Nao. Eu entro quando o produto precisa sair do papel inteiro: interface, codigo, integracao, IA aplicada e colocacao em producao." },
              },
              {
                "@type": "Question",
                name: "Voce pega produto do zero ou melhora produto existente?",
                acceptedAnswer: { "@type": "Answer", text: "Os dois. Posso entrar do conceito ao primeiro deploy ou em produto que ja roda e precisa de clareza, velocidade e estrutura." },
              },
              {
                "@type": "Question",
                name: "Quando faz sentido usar IA?",
                acceptedAnswer: { "@type": "Answer", text: "Quando ela reduz ciclo, melhora operacao ou destrava capacidade do produto. Nao uso IA como ornamento." },
              },
              {
                "@type": "Question",
                name: "Voce tambem treina time?",
                acceptedAnswer: { "@type": "Answer", text: "Sim. Principalmente em fluxo pratico de uso de IA, Vibe Coding, agentes e automacao. O foco e o time produzir melhor, nao assistir palestra." },
              },
              {
                "@type": "Question",
                name: "Voce faz LP e identidade visual?",
                acceptedAnswer: { "@type": "Answer", text: "Sim. LP, branding, trafego pago, Google Analytics, SEO tecnico. Posicionamento digital completo." },
              },
              {
                "@type": "Question",
                name: "Como funciona o monitoramento tecnico?",
                acceptedAnswer: { "@type": "Answer", text: "Zabbix coleta e mapeia. Grafana exibe com dashboards customizados. API propria para converter protocolos SNMP de dispositivos como lacos indutivos, cameras panoramicas e displays de lombada." },
              },
            ],
          }),
        }}
      />
    </main>
  );
}
