"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowDown } from "lucide-react";
import { AnimatedSphere } from "./animated-sphere";

const words = ["construir", "automatizar", "escalar", "monitorar", "treinar"];

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => { setIsVisible(true); }, []);

  // Cursor blink
  useEffect(() => {
    const blink = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(blink);
  }, []);

  // Typewriter effect
  const typewrite = useCallback(() => {
    const currentWord = words[wordIndex];

    if (!isDeleting) {
      // Typing
      if (displayText.length < currentWord.length) {
        return setTimeout(() => {
          setDisplayText(currentWord.slice(0, displayText.length + 1));
        }, 80 + Math.random() * 40); // Slight randomness for natural feel
      } else {
        // Pause before deleting
        return setTimeout(() => setIsDeleting(true), 2000);
      }
    } else {
      // Deleting
      if (displayText.length > 0) {
        return setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 40);
      } else {
        // Move to next word
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % words.length);
        return setTimeout(() => {}, 300);
      }
    }
  }, [displayText, isDeleting, wordIndex]);

  useEffect(() => {
    const timeout = typewrite();
    return () => clearTimeout(timeout);
  }, [typewrite]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="inicio" className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {/* Animated sphere — now in teal */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] lg:w-[800px] lg:h-[800px] opacity-30 pointer-events-none">
        <AnimatedSphere />
      </div>

      {/* Grid lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        {[...Array(8)].map((_, i) => (
          <div key={`h-${i}`} className="absolute h-px bg-foreground/10" style={{ top: `${12.5 * (i + 1)}%`, left: 0, right: 0 }} />
        ))}
        {[...Array(12)].map((_, i) => (
          <div key={`v-${i}`} className="absolute w-px bg-foreground/10" style={{ left: `${8.33 * (i + 1)}%`, top: 0, bottom: 0 }} />
        ))}
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 py-32 lg:py-40">
        {/* Eyebrow */}
        <div className={`mb-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <span className="inline-flex items-center gap-3 font-offbit text-base lg:text-lg text-accent tracking-wider uppercase">
            <span className="w-12 h-px bg-accent/50" />
            DESIGN ENGINEER
          </span>
        </div>

        {/* H1 with typewriter word in OffBit */}
        <div className="mb-12">
          <h1 className={`text-[clamp(2.5rem,10vw,8rem)] font-black leading-[0.9] tracking-tight transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <span className="block">Seu produto digital.</span>
            <span className="block">
              Do zero ao deploy.{" "}
            </span>
            {/* Typewriter word — OffBit, teal, with cursor */}
            <span className="block mt-2">
              <span className="font-offbit text-primary text-[clamp(2rem,8vw,6.5rem)] tracking-wider">
                {displayText}
              </span>
              <span
                className={`inline-block w-[3px] lg:w-[4px] h-[0.8em] bg-accent ml-1 align-middle transition-opacity duration-100 ${
                  cursorVisible ? "opacity-100" : "opacity-0"
                }`}
              />
            </span>
          </h1>
        </div>

        {/* Description + CTAs */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-end">
          <p className={`text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-xl transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            Interface, codigo, backend e IA aplicada. Entrego rodando em semanas — nao em meses. Sem separar design, dev e estrategia em tres frentes.
          </p>

          <div className={`flex flex-col sm:flex-row items-start gap-4 transition-all duration-700 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-14 text-base rounded-full group cursor-pointer font-bold"
              onClick={() => scrollTo("portfolio")}
            >
              Ver projetos
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-base rounded-full border-foreground/20 text-foreground hover:bg-foreground/5 cursor-pointer"
              asChild
            >
              <a href="https://wa.me/5564999271254" target="_blank" rel="noopener noreferrer">
                Falar no WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Proof strip */}
      <div className={`absolute bottom-24 left-0 right-0 transition-all duration-700 delay-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
        <div className="flex gap-16 marquee whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-16">
              {[
                { value: "7+", label: "produtos em producao", tag: "PORTFOLIO" },
                { value: "13+", label: "anos de experiencia", tag: "DESDE 2012" },
                { value: "5", label: "verticais de mercado", tag: "MULTI-SETOR" },
                { value: "43h", label: "MVP mais rapido", tag: "BBL0CK" },
              ].map((stat) => (
                <div key={`${stat.tag}-${i}`} className="flex items-baseline gap-4">
                  <span className="text-4xl lg:text-5xl font-black text-foreground">{stat.value}</span>
                  <span className="text-sm text-muted-foreground">
                    {stat.label}
                    <span className="block font-offbit text-sm text-accent/70 mt-1">{stat.tag}</span>
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => scrollTo("servicos")} aria-label="Rolar para servicos" className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground hover:text-primary transition-colors animate-bounce cursor-pointer">
        <ArrowDown size={24} />
      </button>
    </section>
  );
}
