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
      "Como agentes de IA estao transformando o desenvolvimento de software e por que vibe coding nao e apenas hype.",
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
