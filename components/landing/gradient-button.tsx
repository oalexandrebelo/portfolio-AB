"use client";

import { ReactNode, useRef, useState, useEffect, useCallback } from "react";

interface GradientButtonProps {
  children: ReactNode;
  href?: string;
  className?: string;
  variant?: "primary" | "outline";
  onClick?: () => void;
}

const BLOBS = [
  { size: 100, color: "#00E5CC", blur: 20, opacity: 0.9 },
  { size: 90, color: "#73BFBF", blur: 18, opacity: 0.85 },
  { size: 80, color: "#00D4AA", blur: 20, opacity: 0.8 },
  { size: 85, color: "#4EECD4", blur: 18, opacity: 0.75 },
  { size: 70, color: "#14B8A6", blur: 16, opacity: 0.9 },
  { size: 75, color: "#2DD4BF", blur: 18, opacity: 0.8 },
];

function randomPos() {
  return `translate(${(Math.random() - 0.5) * 200}%, ${(Math.random() - 0.5) * 200}%)`;
}

export function GradientButton({
  children,
  href,
  className = "",
  variant = "primary",
  onClick,
}: GradientButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [positions, setPositions] = useState(() => BLOBS.map(() => randomPos()));

  // Continuously animate blob positions every 2.5s — iconsax pattern
  const animate = useCallback(() => {
    setPositions(BLOBS.map(() => randomPos()));
  }, []);

  useEffect(() => {
    animate();
    const interval = setInterval(animate, 2500);
    return () => clearInterval(interval);
  }, [animate]);

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
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-[25px] h-[46px] min-h-[46px] px-8 text-[15px] font-medium text-foreground cursor-pointer bg-card border-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Layer 5: content */}
      <div className="relative z-20 flex items-center gap-2" style={{
        filter: "drop-shadow(0 0 8px rgba(0,0,0,0.5))",
        textShadow: "0 0 8px rgba(0,0,0,0.5)",
      }}>
        {children}
      </div>

      {/* Layer 4: gradient-0 — dark overlay on hover */}
      <div
        className="absolute inset-[2px] z-[12] rounded-[25px] transition-all duration-500"
        style={{
          background: "var(--background)",
          filter: hovered ? "blur(0px)" : "blur(10px)",
          opacity: hovered ? 1 : 0,
        }}
      />

      {/* Layer 3: radial highlight */}
      <div
        className="absolute inset-0 z-[12] rounded-[25px]"
        style={{
          background: "radial-gradient(103.46% 134.6% at 64.66% 50%, rgba(115,191,191,0) 27.37%, rgba(115,191,191,0.2) 100%)",
        }}
      />

      {/* Layer 2: glass */}
      <div
        className="absolute z-[10] rounded-[25px]"
        style={{
          inset: "-7px -14px",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      />

      {/* Layer 1: animated color blobs — continuously moving */}
      <div
        ref={ref}
        className="absolute inset-0 z-[5] rounded-[25px] overflow-hidden transition-transform duration-500"
        style={{
          transform: hovered ? "scale(0.8)" : "scale(1.1)",
        }}
      >
        {BLOBS.map((blob, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: blob.size,
              height: blob.size,
              background: blob.color,
              filter: `blur(${blob.blur}px)`,
              opacity: blob.opacity,
              transform: positions[i],
              transition: "transform 2s ease",
            }}
          />
        ))}
      </div>

      {/* Layer 0: border */}
      <div className="absolute inset-0 rounded-[25px] border border-foreground/10" />
    </Wrapper>
  );
}
