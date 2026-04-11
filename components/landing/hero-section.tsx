"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowRight, ArrowDown } from "lucide-react";
import { AnimatedSphere } from "./animated-sphere";
import { GradientButton } from "./gradient-button";

const words = [
  "construir seu MVP?",
  "automatizar sua operação?",
  "monitorar seus dispositivos?",
  "treinar seu time?",
  "escalar seu negócio?",
];

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const blink = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(blink);
  }, []);

  const typewrite = useCallback(() => {
    const currentWord = words[wordIndex];

    if (!isDeleting) {
      if (displayText.length < currentWord.length) {
        return setTimeout(() => {
          setDisplayText(currentWord.slice(0, displayText.length + 1));
        }, 80 + Math.random() * 40);
      }
      return setTimeout(() => setIsDeleting(true), 2000);
    }

    if (displayText.length > 0) {
      return setTimeout(() => {
        setDisplayText(displayText.slice(0, -1));
      }, 40);
    }

    setIsDeleting(false);
    setWordIndex((prev) => (prev + 1) % words.length);
    return setTimeout(() => {}, 300);
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
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] lg:w-[800px] lg:h-[800px] opacity-30 pointer-events-none">
        <AnimatedSphere />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        {[...Array(8)].map((_, i) => (
          <div key={`h-${i}`} className="absolute h-px bg-foreground/10" style={{ top: `${12.5 * (i + 1)}%`, left: 0, right: 0 }} />
        ))}
        {[...Array(12)].map((_, i) => (
          <div key={`v-${i}`} className="absolute w-px bg-foreground/10" style={{ left: `${8.33 * (i + 1)}%`, top: 0, bottom: 0 }} />
        ))}
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 py-32 lg:py-40">
        <div className={`mb-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <span className="inline-flex items-center gap-3 font-offbit text-base lg:text-lg text-accent tracking-wider uppercase">
            <span className="w-12 h-px bg-accent/50" />
            DESIGN ENGINEER
          </span>
        </div>

        <div className="mb-12">
          <h1 className={`font-black leading-[0.9] tracking-tight transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <span className="block text-[clamp(2rem,5.5vw,5.5rem)]">Seu produto digital.</span>
            <span className="block text-[clamp(2rem,5.5vw,5.5rem)]">Do zero ao deploy.</span>

            <span className="block mt-3 overflow-hidden" style={{ height: "clamp(3.5rem, 6vw, 5rem)" }}>
              <span className="font-offbit font-bold text-primary text-[clamp(1.5rem,4.5vw,4.5rem)] tracking-wider inline-block">
                {displayText}
              </span>
              <span
                className={`inline-block w-[2px] lg:w-[3px] bg-accent ml-1 align-baseline transition-opacity duration-100 ${
                  cursorVisible ? "opacity-100" : "opacity-0"
                }`}
                style={{ height: "clamp(1.5rem, 4vw, 3.5rem)" }}
              />
            </span>
          </h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-end">
          <p className={`text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-xl transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            Design e código na mesma mão. Do conceito ao deploy com Vibe Coding, IA aplicada e parceiros para escalar quando o projeto pede.
          </p>

          <div className={`flex flex-col sm:flex-row items-start gap-4 transition-all duration-700 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <GradientButton onClick={() => scrollTo("portfolio")}>
              Ver projetos
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </GradientButton>
            <GradientButton href="https://wa.me/5564999271254" variant="outline">
              Falar no WhatsApp
            </GradientButton>
          </div>
        </div>
      </div>

      <div className={`absolute bottom-24 left-0 right-0 overflow-hidden transition-all duration-700 delay-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
        <div className="flex w-max marquee-strip">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex shrink-0 gap-16 mr-16">
              {[
                { value: "7+", label: "produtos em produção", tag: "PORTFÓLIO" },
                { value: "13+", label: "anos de experiência", tag: "DESDE 2012" },
                { value: "5", label: "verticais de mercado", tag: "MULTI-SETOR" },
                { value: "43h", label: "MVP em produção", tag: "BBL0CK" },
              ].map((stat) => (
                <div key={`${stat.tag}-${i}`} className="flex items-baseline gap-4 shrink-0">
                  <span className="text-4xl lg:text-5xl font-black text-foreground">{stat.value}</span>
                  <span className="text-sm text-muted-foreground">
                    {stat.label}
                    <span className="inline-block font-offbit text-sm text-foreground/90 mt-1 px-2 py-0.5 rounded bg-[#042940]">{stat.tag}</span>
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => scrollTo("servicos")} aria-label="Rolar para serviços" className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground hover:text-primary transition-colors animate-bounce cursor-pointer">
        <ArrowDown size={24} />
      </button>
    </section>
  );
}
