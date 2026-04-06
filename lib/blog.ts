export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  readingTime: string;
}

const posts: BlogPost[] = [
  {
    slug: "pixel-agents",
    title: "Pixel Agents: IA que constroi com voce",
    date: "06 de abril de 2026",
    description:
      "Agentes de IA especializados em construir software com voce. Como Claude Code, Cursor e Copilot evoluiram de autocompleters para agentes autonomos que executam.",
    tags: ["IA", "vibe-coding", "agents", "produto"],
    readingTime: "4 min de leitura",
  },
];

export function getAllPosts(): BlogPost[] {
  return posts;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((post) => post.slug === slug);
}
