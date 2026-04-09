"use client";

import { useEffect, useRef } from "react";

const DOT_SPACING = 40;
const DOT_RADIUS = 1;
const MOUSE_RADIUS = 150;
const BASE_OPACITY = 0.08;
const DOT_COLOR = "115, 191, 191"; // teal RGB

export function DotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const scrollRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
    };

    resize();

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onScroll = () => {
      scrollRef.current = window.scrollY;
    };

    const draw = () => {
      if (!ctx) return;
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      const scrollOffset = (scrollRef.current * -0.4) % DOT_SPACING;

      for (let row = -DOT_SPACING; row < h + DOT_SPACING; row += DOT_SPACING) {
        for (let col = 0; col < w; col += DOT_SPACING) {
          const y = row + scrollOffset;
          let opacity = BASE_OPACITY;

          // Mouse proximity brightens dots
          const dx = col - mouseRef.current.x;
          const dy = y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_RADIUS) {
            opacity += (1 - dist / MOUSE_RADIUS) * 0.4;
          }

          opacity = Math.min(1, opacity);

          ctx.fillStyle = `rgba(${DOT_COLOR}, ${opacity.toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(col, y, DOT_RADIUS, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animFrame = requestAnimationFrame(draw);
    };

    draw();

    window.addEventListener("mousemove", onMouse);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -2 }}
      aria-hidden="true"
    />
  );
}
