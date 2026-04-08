import Link from "next/link";

interface ArticleCardProps {
  number: string;
  title: string;
  slug: string;
  date: string;
}

export default function ArticleCard({
  number,
  title,
  slug,
}: ArticleCardProps) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="group block border border-foreground/20 hover:border-foreground bg-card hover:bg-secondary transition-colors"
    >
      <div className="flex items-center gap-3 p-3 md:p-4">
        {/* Traffic light dots */}
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A50]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFB53B]" />
          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center gap-2 md:gap-4 overflow-hidden">
          <span className="text-primary font-code text-sm shrink-0">{number}</span>
          <span className="text-muted-foreground hidden md:inline font-code">//</span>
          <h3 className="text-foreground font-code text-sm md:text-base truncate group-hover:text-primary transition-colors">
            {title}
          </h3>
        </div>

        {/* Arrow */}
        <span className="text-muted-foreground group-hover:text-foreground transition-colors text-lg shrink-0">
          →
        </span>
      </div>
    </Link>
  );
}
