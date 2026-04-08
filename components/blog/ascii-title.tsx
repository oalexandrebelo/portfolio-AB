"use client";

const ASCII_ART = `██████╗ ██╗      ██████╗  ██████╗     █████╗ ██╗
██╔══██╗██║     ██╔═══██╗██╔════╝    ██╔══██╗██║
██████╔╝██║     ██║   ██║██║  ███╗   ███████║██║
██╔══██╗██║     ██║   ██║██║   ██║   ██╔══██║██║
██████╔╝███████╗╚██████╔╝╚██████╔╝██╗██║  ██║██║
╚═════╝ ╚══════╝ ╚═════╝  ╚═════╝ ╚═╝╚═╝  ╚═╝╚═╝`;

export default function AsciiTitle() {
  return (
    <section className="relative w-full flex justify-center py-8 px-4">
      <div
        className="flex flex-col items-start"
        role="img"
        aria-label="blog.AI @alexandrebelo"
      >
        <pre
          className="text-foreground text-[8px] md:text-sm leading-tight whitespace-pre select-none"
          style={{ fontFamily: "'Courier New', Courier, monospace" }}
        >
          {ASCII_ART}
        </pre>
        <span className="font-offbit-dot text-foreground text-lg md:text-2xl -mt-1 ml-auto">
          @alexandrebelo
        </span>
      </div>
    </section>
  );
}
