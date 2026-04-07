"use client";

import { ReactNode } from "react";

interface GradientButtonProps {
  children: ReactNode;
  href?: string;
  className?: string;
  variant?: "primary" | "outline";
}

/**
 * Gradient CTA button — iconsax.io pattern adapted to AB DS
 * 6 color blobs + glass + backdrop blur + hover scale
 */
export function GradientButton({
  children,
  href,
  className = "",
  variant = "primary",
}: GradientButtonProps) {
  const Wrapper = href ? "a" : "button";
  const props = href
    ? { href, target: "_blank" as const, rel: "noopener noreferrer" }
    : {};

  if (variant === "outline") {
    return (
      <Wrapper
        {...(props as any)}
        className={`group relative inline-flex items-center justify-center overflow-hidden rounded-2xl px-8 py-4 text-base font-bold cursor-pointer transition-all active:scale-[0.98] border border-foreground/20 text-foreground hover:border-foreground/40 hover:bg-foreground/5 ${className}`}
      >
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </Wrapper>
    );
  }

  return (
    <Wrapper
      {...(props as any)}
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-2xl px-8 py-4 text-base font-bold text-white cursor-pointer transition-transform active:scale-[0.98] ${className}`}
    >
      {/* Content — highest z-index */}
      <span className="relative z-20 flex items-center gap-2 drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]">
        {children}
      </span>

      {/* Glass layer — blur backdrop */}
      <span className="absolute inset-[1px] z-10 rounded-2xl bg-white/[0.07] backdrop-blur-[20px]" />

      {/* Radial gradient overlay */}
      <span className="absolute inset-0 z-[9] rounded-2xl bg-[radial-gradient(circle_at_50%_50%,rgba(115,191,191,0.15),transparent_70%)]" />

      {/* 6 animated color blobs — iconsax pattern in AB colors */}
      <span className="absolute inset-0 overflow-hidden rounded-2xl transition-transform duration-500 group-hover:scale-110">
        {/* Teal blobs */}
        <span
          className="absolute w-28 h-28 rounded-full blur-2xl animate-[aurora-1_8s_ease-in-out_infinite]"
          style={{ background: "#73BFBF", opacity: 0.7 }}
        />
        <span
          className="absolute w-20 h-20 rounded-full blur-2xl animate-[aurora-3_10s_ease-in-out_infinite]"
          style={{ background: "#5AADA8", opacity: 0.5 }}
        />
        {/* Orange blobs */}
        <span
          className="absolute w-24 h-24 rounded-full blur-2xl animate-[aurora-2_6s_ease-in-out_infinite]"
          style={{ background: "#E8553A", opacity: 0.6 }}
        />
        <span
          className="absolute w-16 h-16 rounded-full blur-2xl animate-[aurora-5_9s_ease-in-out_infinite]"
          style={{ background: "#D97757", opacity: 0.4 }}
        />
        {/* Navy depth */}
        <span
          className="absolute w-24 h-24 rounded-full blur-2xl animate-[aurora-4_7s_ease-in-out_infinite]"
          style={{ background: "#042940", opacity: 0.6 }}
        />
        {/* Accent purple for richness */}
        <span
          className="absolute w-16 h-16 rounded-full blur-2xl animate-[aurora-6_11s_ease-in-out_infinite]"
          style={{ background: "#A259FF", opacity: 0.3 }}
        />
      </span>

      {/* Border with subtle gradient */}
      <span className="absolute inset-0 rounded-2xl border border-white/20 group-hover:border-white/30 transition-colors" />

      {/* Base dark fill */}
      <span className="absolute inset-0 rounded-2xl bg-foreground/80" />
    </Wrapper>
  );
}
