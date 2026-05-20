import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "blog.AIAB — IA aplicada e produto digital | Alexandre Belo" },
  description:
    "Artigos sobre IA aplicada, automação, Vibe Coding e produto digital — da prática de quem constrói e coloca em produção. Sem hype.",
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
