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
  date,
}: ArticleCardProps) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="group block border border-border/50 hover:border-foreground bg-card hover:bg-secondary rounded-lg transition-all duration-300"
    >
      {/* Traffic light dots */}
      <div className="flex items-center gap-1.5 px-4 pt-3 pb-2">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#FF5A50]" />
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#FFB53B]" />
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary" />
      </div>

      {/* Content */}
      <div className="flex items-center justify-between gap-4 px-4 pb-4">
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="font-offbit text-primary text-sm shrink-0">
            {number}.
          </span>
          <div className="min-w-0">
            <h2 className="font-offbit text-foreground text-base sm:text-lg truncate">
              {title}
            </h2>
            <p className="text-muted-foreground text-xs mt-1">{date}</p>
          </div>
        </div>

        {/* Arrow */}
        <span className="text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1 shrink-0 text-lg">
          &rarr;
        </span>
      </div>
    </Link>
  );
}
