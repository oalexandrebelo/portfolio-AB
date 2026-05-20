"use client";

import { useEffect, useState } from "react";
import { Menu, X, PenLine } from "lucide-react";
import { GradientButton } from "./gradient-button";

const navItems = [
  { href: "#servicos", label: "Serviços" },
  { href: "#portfolio", label: "Portfólio" },
  { href: "#metodologia", label: "Metodologia" },
  { href: "#stack", label: "Stack" },
  { href: "#contato", label: "Contato" },
];

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isPastHero, setIsPastHero] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      setIsPastHero(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "top-4 left-4 right-4 bg-background/80 backdrop-blur-xl rounded-2xl border border-border/50 shadow-sm"
          : "bg-transparent"
      }`}>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => scrollTo("#inicio")} className="cursor-pointer flex items-center gap-3">
              <img src="/logo-ab.svg" alt="Alexandre Belo - Design Engineer" className="h-12 w-auto" />
              <span className="text-sm font-medium text-foreground/80 hidden sm:inline">Alexandre Belo</span>
            </button>

            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => scrollTo(item.href)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer font-medium"
                >
                  {item.label}
                </button>
              ))}
              <a
                href="/blog"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                <PenLine size={14} />
                Blog
              </a>
            </nav>

            <div className={`hidden md:flex items-center gap-3 transition-all duration-500 ${isPastHero ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
              <GradientButton
                href="https://wa.me/5564999271254"
                className={`transition-all duration-500 ${isScrolled ? "h-9 px-4 text-sm" : ""}`}
                track={{ event: "generate_lead", params: { method: "whatsapp", cta_location: "nav" } }}
              >
                Falar no WhatsApp
              </GradientButton>
            </div>

            <button className="md:hidden text-foreground cursor-pointer" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8">
          {navItems.map((item, i) => (
            <button
              key={item.href}
              onClick={() => scrollTo(item.href)}
              className="text-3xl font-black text-foreground hover:text-primary transition-colors cursor-pointer"
              style={{ animationDelay: `${i * 75}ms` }}
            >
              {item.label}
            </button>
          ))}
          <a
            href="/blog"
            className="flex items-center gap-2 text-2xl font-black text-foreground hover:text-primary transition-colors"
          >
            <PenLine size={20} />
            Blog
          </a>
          <GradientButton
            href="https://wa.me/5564999271254"
            className="mt-8"
            track={{ event: "generate_lead", params: { method: "whatsapp", cta_location: "nav_mobile" } }}
          >
            Falar no WhatsApp
          </GradientButton>
        </div>
      )}
    </>
  );
}
