"use client";

import { ReactNode } from "react";

interface GradientButtonProps {
  children: ReactNode;
  href?: string;
  className?: string;
}

export function GradientButton({ children, href, className = "" }: GradientButtonProps) {
  const Wrapper = href ? "a" : "button";
  const props = href
    ? { href, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Wrapper
      {...(props as any)}
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-2xl px-8 py-4 text-base font-bold text-white cursor-pointer transition-transform active:scale-[0.98] ${className}`}
    >
      {/* Content layer — on top */}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>

      {/* Border */}
      <span className="absolute inset-0 rounded-2xl border border-white/20" />

      {/* Glass layer */}
      <span className="absolute inset-[1px] rounded-2xl bg-white/5 backdrop-blur-sm" />

      {/* Animated aurora gradient */}
      <span className="absolute inset-0 overflow-hidden rounded-2xl">
        <span
          className="absolute w-24 h-24 rounded-full blur-2xl animate-[aurora-1_8s_ease-in-out_infinite]"
          style={{ background: "#73BFBF", opacity: 0.6 }}
        />
        <span
          className="absolute w-20 h-20 rounded-full blur-2xl animate-[aurora-2_6s_ease-in-out_infinite]"
          style={{ background: "#E8553A", opacity: 0.5 }}
        />
        <span
          className="absolute w-16 h-16 rounded-full blur-2xl animate-[aurora-3_10s_ease-in-out_infinite]"
          style={{ background: "#73BFBF", opacity: 0.4 }}
        />
        <span
          className="absolute w-20 h-20 rounded-full blur-2xl animate-[aurora-4_7s_ease-in-out_infinite]"
          style={{ background: "#A259FF", opacity: 0.3 }}
        />
      </span>

      {/* Base gradient */}
      <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/40 via-accent/20 to-primary/30" />
    </Wrapper>
  );
}
