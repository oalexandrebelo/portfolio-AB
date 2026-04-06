"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const navItems = [
  { href: "#servicos", label: "Servicos" },
  { href: "#portfolio", label: "Portfolio" },
  { href: "#metodologia", label: "Metodologia" },
  { href: "#stack", label: "Stack" },
  { href: "#contato", label: "Contato" },
];

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
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
            {/* Logo */}
            <button onClick={() => scrollTo("#inicio")} className="cursor-pointer flex items-center gap-3">
              <img src="/logo-ab.svg" alt="AB" className="h-12 w-auto" />
              <span className="text-sm font-medium text-foreground/80 hidden sm:inline">Alexandre Belo</span>
            </button>

            {/* Desktop nav */}
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
            </nav>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                size={isScrolled ? "sm" : "default"}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full transition-all duration-500 cursor-pointer font-bold"
                asChild
              >
                <a href="https://wa.me/5564999271254" target="_blank" rel="noopener noreferrer">
                  Falar no WhatsApp
                </a>
              </Button>
            </div>

            {/* Mobile toggle */}
            <button className="md:hidden text-foreground cursor-pointer" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
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
          <Button size="lg" className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full cursor-pointer font-bold" asChild>
            <a href="https://wa.me/5564999271254" target="_blank" rel="noopener noreferrer">
              Falar no WhatsApp
            </a>
          </Button>
        </div>
      )}
    </>
  );
}
