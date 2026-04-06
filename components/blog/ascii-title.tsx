"use client";

export default function AsciiTitle() {
  return (
    <div className="select-none" aria-label="blog.AIAB">
      <pre
        className="font-offbit text-[6px] leading-[1.1] sm:text-[8px] md:text-xs text-foreground whitespace-pre"
        aria-hidden="true"
      >
        {`
 ██████  ██       ██████   ██████        █████  ██  █████  ██████
 ██   ██ ██      ██    ██ ██            ██   ██ ██ ██   ██ ██   ██
 ██████  ██      ██    ██ ██   ███      █████   ██ █████   ██████
 ██   ██ ██      ██    ██ ██    ██      ██   ██ ██ ██   ██ ██   ██
 ██████  ███████  ██████   ██████  ██   █████  ██ █████   ██████
        `.trim()}
      </pre>
      <p className="text-right font-offbit text-xs sm:text-sm text-primary mt-1 tracking-widest">
        .com
      </p>
    </div>
  );
}
