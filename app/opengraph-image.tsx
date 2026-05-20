import { ImageResponse } from "next/og";

export const alt = "Alexandre Belo — Design Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Dynamic Open Graph image (1200x630) — replaces the old SVG that social
// platforms could not render. Generated on-brand with the design system
// palette (charcoal / creme / teal / orange).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#242426",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ width: 64, height: 6, backgroundColor: "#73BFBF" }} />
          <div
            style={{
              display: "flex",
              color: "#73BFBF",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 5,
            }}
          >
            DESIGN ENGINEER
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              color: "#F4EFE5",
              fontSize: 108,
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            Alexandre Belo
          </div>
          <div
            style={{
              display: "flex",
              color: "#A8A29A",
              fontSize: 44,
              fontWeight: 500,
              marginTop: 26,
            }}
          >
            Seu produto digital. Do zero ao deploy.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              color: "#73BFBF",
              fontSize: 30,
              fontWeight: 600,
            }}
          >
            alexandrebelo.com.br
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              color: "#A8A29A",
              fontSize: 26,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 999,
                backgroundColor: "#E8553A",
              }}
            />
            IA aplicada · Produto · Automação
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
