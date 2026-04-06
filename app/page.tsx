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

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden noise-overlay">
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
    </main>
  );
}
