import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "blog.AIAB | Alexandre Belo",
  description:
    "IA aplicada, automacao, vibe coding e produto digital. Sem hype.",
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}
