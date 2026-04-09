"use client";

import { ReactNode, useRef, useState } from "react";

interface GradientButtonProps {
  children: ReactNode;
  href?: string;
  className?: string;
  variant?: "primary" | "outline";
  onClick?: () => void;
}

/**
 * Gradient CTA — exact iconsax.io 5-layer structure adapted to AB DS
 * Layers (bottom to top): base → gradient-2 (color blobs) → glass → gradient-1 (radial) → gradient-0 (blur) → content
 */
export function GradientButton({
  children,
  href,
  className = "",
  variant = "primary",
  onClick,
}: GradientButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const Wrapper = href ? "a" : "button";
  const isExternal = href && !href.startsWith("#") && !href.startsWith("/");
  const linkProps = href
    ? {
        href,
        ...(isExternal ? { target: "_blank" as const, rel: "noopener noreferrer" } : {}),
      }
    : {};

  if (variant === "outline") {
    return (
      <Wrapper
        {...(linkProps as any)}
        onClick={onClick}
        className={`group relative inline-flex items-center justify-center overflow-hidden rounded-[25px] px-8 h-[46px] text-[15px] font-medium cursor-pointer transition-all active:scale-[0.98] border border-foreground/20 text-foreground hover:border-foreground/40 bg-transparent focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${className}`}
      >
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </Wrapper>
    );
  }

  return (
    <Wrapper
      {...(linkProps as any)}
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-[25px] h-[46px] min-h-[46px] px-8 text-[15px] font-medium text-foreground cursor-pointer bg-card border-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${className}`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Layer 5: btn-content — highest z-index */}
      <div className="relative z-20 flex items-center gap-2" style={{
        filter: "drop-shadow(0 0 8px rgba(0,0,0,0.5))",
        textShadow: "0 0 8px rgba(0,0,0,0.5)",
      }}>
        {children}
      </div>

      {/* Layer 4: gradient-0 — blur overlay that appears on hover */}
      <div
        className="absolute inset-[2px] z-[12] rounded-[25px] transition-all duration-500"
        style={{
          background: "var(--background)",
          filter: hovered ? "blur(0px)" : "blur(10px)",
          opacity: hovered ? 1 : 0,
        }}
      />

      {/* Layer 3: gradient-1 — radial gradient (always visible) */}
      <div
        className="absolute inset-0 z-[12] rounded-[25px]"
        style={{
          background: "radial-gradient(103.46% 134.6% at 64.66% 50%, rgba(217,217,217,0) 27.37%, rgba(217,217,217,0.15) 100%)",
        }}
      />

      {/* Layer 2: glass — backdrop blur */}
      <div
        className="absolute z-[10] rounded-[25px]"
        style={{
          inset: "-7px -14px",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      />

      {/* Layer 1: gradient-2 — animated color blobs */}
      <div
        ref={ref}
        className="absolute inset-0 z-[5] rounded-[25px] overflow-hidden transition-transform duration-500"
        style={{
          transform: hovered ? "scale(0.8)" : "scale(1.1)",
        }}
      >
        {/* 6 color blobs — teal/blue dominant */}
        <div className="absolute rounded-full transition-transform duration-[3000ms] ease-in-out"
          style={{ width: 80, height: 80, background: "#73BFBF", filter: "blur(25px)", transform: `translate(${hovered ? "20%" : "-9%"}, ${hovered ? "-30%" : "97%"})` }} />
        <div className="absolute rounded-full transition-transform duration-[2500ms] ease-in-out"
          style={{ width: 70, height: 70, background: "#5AADA8", filter: "blur(25px)", transform: `translate(${hovered ? "60%" : "2%"}, ${hovered ? "80%" : "12%"})` }} />
        <div className="absolute rounded-full transition-transform duration-[3500ms] ease-in-out"
          style={{ width: 60, height: 60, background: "#4DC8C8", filter: "blur(25px)", transform: `translate(${hovered ? "-20%" : "-50%"}, ${hovered ? "40%" : "11%"})` }} />
        <div className="absolute rounded-full transition-transform duration-[2800ms] ease-in-out"
          style={{ width: 75, height: 75, background: "#042940", filter: "blur(25px)", transform: `translate(${hovered ? "80%" : "20%"}, ${hovered ? "-60%" : "-49%"})` }} />
        <div className="absolute rounded-full transition-transform duration-[3200ms] ease-in-out"
          style={{ width: 65, height: 65, background: "#1A6B6B", filter: "blur(20px)", transform: `translate(${hovered ? "-40%" : "6%"}, ${hovered ? "20%" : "60%"})` }} />
        <div className="absolute rounded-full transition-transform duration-[2200ms] ease-in-out"
          style={{ width: 55, height: 55, background: "#2EC4B6", filter: "blur(25px)", transform: `translate(${hovered ? "50%" : "-17%"}, ${hovered ? "-80%" : "75%"})` }} />
      </div>

      {/* Layer 0: border */}
      <div className="absolute inset-0 rounded-[25px] border border-foreground/10" />
    </Wrapper>
  );
}
