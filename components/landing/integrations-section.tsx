"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const outerTools = [
  { name: "Claude", letter: "C", color: "#D97757" },
  { name: "Antigravity", letter: "AG", color: "#73BFBF" },
  { name: "Notion", letter: "N", color: "#ffffff" },
  { name: "Supabase", letter: "SB", color: "#3ECF8E" },
  { name: "OpenAI", letter: "AI", color: "#10A37F" },
  { name: "Discord", letter: "Ds", color: "#5865F2" },
  { name: "Figma", letter: "Fi", color: "#A259FF" },
];

const middleTools = [
  { name: "n8n", letter: "n8", color: "#EA4B71" },
  { name: "Chatwoot", letter: "CW", color: "#1F93FF" },
  { name: "Python", letter: "Py", color: "#FFD43B" },
  { name: "Codex", letter: "Cx", color: "#10A37F" },
];

const innerTools = [
  { name: "TypeScript", letter: "TS", color: "#3178C6" },
  { name: "React", letter: "Re", color: "#61DAFB" },
];

function OrbitRing({
  tools,
  size,
  duration,
  reverse = false,
}: {
  tools: typeof outerTools;
  size: number;
  duration: number;
  reverse?: boolean;
}) {
  const radius = size / 2;
  const angleStep = 360 / tools.length;

  return (
    <div
      className={`absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full ${
        reverse ? "animate-counter-orbit" : "animate-orbit"
      }`}
      style={{ width: size, height: size, "--duration": `${duration}s` } as React.CSSProperties}
    >
      <div className="relative h-full w-full">
        {tools.map((tool, i) => {
          const angle = angleStep * i;
          return (
            <div
              key={tool.name}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ transform: `rotate(${angle}deg) translateX(${radius}px)` }}
            >
              <div style={{ transform: `rotate(-${angle}deg)` }}>
                <div
                  className={`shadow-aceternity flex size-14 items-center justify-center rounded-md bg-card border border-border/50 ${
                    reverse ? "animate-orbit" : "animate-counter-orbit"
                  }`}
                  style={{ "--duration": `${duration}s` } as React.CSSProperties}
                  title={tool.name}
                >
                  {/* OffBit scaled to text-base for orbital icons */}
                  <span className="font-offbit text-base font-bold" style={{ color: tool.color }}>
                    {tool.letter}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function IntegrationsSection() {
  return (
    <section className="relative border-t border-border/50">
      <div className="max-w-[1400px] mx-auto border-x border-border/30 relative flex min-h-[480px] flex-col items-center justify-center overflow-hidden px-4 py-4 md:min-h-[600px]">
        {/* Orbital rings */}
        <div
          className="mx-auto flex items-center justify-center absolute inset-x-0 -top-[480px] mask-b-from-30%"
          style={{ width: 800, height: 800 }}
        >
          <div className="pointer-events-none absolute inset-0 z-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-inner bg-muted/30" style={{ width: 752, height: 752 }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-inner bg-muted/50" style={{ width: 544, height: 544 }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-inner bg-muted/70" style={{ width: 336, height: 336 }} />
          </div>

          <OrbitRing tools={outerTools} size={752} duration={34} />
          <OrbitRing tools={middleTools} size={544} duration={26} reverse />
          <OrbitRing tools={innerTools} size={336} duration={18} />
        </div>

        <h2 className="text-2xl font-bold tracking-tight md:text-3xl lg:text-5xl relative z-10 text-center">
          Utilizamos as melhores ferramentas do mercado,<br />
          <span className="text-primary">vamos bater um papo?</span>
        </h2>
        <Button
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full mt-6 relative z-20 font-bold cursor-pointer group"
          asChild
        >
          <a href="https://wa.me/5564999271254" target="_blank" rel="noopener noreferrer">
            Falar no WhatsApp
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
          </a>
        </Button>
      </div>
    </section>
  );
}
