"use client";

interface MarkdownRendererProps {
  content: string;
  tags?: string[];
}

export function MarkdownRenderer({ content, tags }: MarkdownRendererProps) {
  const html = markdownToHtml(content);

  return (
    <>
      <div
        className="space-y-6"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-4">
          {tags.map((tag) => (
            <span
              key={tag}
              className="font-code text-xs text-primary border border-primary/30 rounded px-2 py-0.5"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function markdownToHtml(md: string): string {
  let html = md
    // Code blocks with language
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre class="bg-background border border-border rounded-lg overflow-hidden"><div class="flex items-center gap-1.5 px-4 py-2 border-b border-border/50"><span class="inline-block w-2 h-2 rounded-full bg-[#FF5A50]"></span><span class="inline-block w-2 h-2 rounded-full bg-[#FFB53B]"></span><span class="inline-block w-2 h-2 rounded-full bg-primary"></span><span class="ml-2 text-muted-foreground text-xs font-code">${lang || "code"}</span></div><code class="block p-4 font-code text-sm text-foreground/80 overflow-x-auto leading-relaxed">${escapeHtml(code.trim())}</code></pre>`;
    })
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="font-code text-sm bg-primary/10 text-primary px-1.5 py-0.5 rounded">$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="font-offbit font-bold text-lg sm:text-xl text-foreground pt-4">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-offbit font-bold text-xl sm:text-2xl text-foreground pt-4">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-offbit font-bold text-2xl sm:text-3xl text-foreground pt-4">$1</h1>')
    // Bold & italic
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-lg my-4 max-w-full" />')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="border-border/50 my-6" />')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary/50 pl-4 italic text-foreground/70">$1</blockquote>')
    // Unordered list items
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-foreground/90">$1</li>')
    // Ordered list items
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-foreground/90">$1</li>')
    // Paragraphs
    .replace(/^(?!<[huplib]|<hr|<block|<pre|<code|<img)(.+)$/gm, '<p class="text-foreground/90 leading-relaxed">$1</p>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li class="ml-4 list-disc[^>]*>.*?<\/li>\n?)+)/g, '<ul class="space-y-1 my-2">$1</ul>');
  html = html.replace(/((?:<li class="ml-4 list-decimal[^>]*>.*?<\/li>\n?)+)/g, '<ol class="space-y-1 my-2">$1</ol>');

  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
