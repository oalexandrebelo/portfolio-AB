export function FooterSection() {
  return (
    <footer className="py-8 border-t border-border/50">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3">
              <img src="/logo-ab.svg" alt="Alexandre Belo - Design Engineer" className="h-8 w-auto" />
              <span className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} Alexandre Belo
              </span>
            </div>
            <span className="text-xs text-muted-foreground/50 font-offbit">
              CNPJ 57.531.384/0001-96
            </span>
          </div>

          <div className="flex items-center gap-8">
            <a href="https://www.linkedin.com/in/alexandrebelo" target="_blank" rel="noopener noreferrer" className="font-offbit text-sm text-muted-foreground hover:text-foreground transition-colors">
              LinkedIn
            </a>
            <a href="https://github.com/oalexandrebelo" target="_blank" rel="noopener noreferrer" className="font-offbit text-sm text-muted-foreground hover:text-foreground transition-colors">
              GitHub
            </a>
            <a href="mailto:contato@alexandrebelo.com.br" className="font-offbit text-sm text-muted-foreground hover:text-foreground transition-colors">
              Email
            </a>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500/80" />
            <span className="font-offbit text-sm text-muted-foreground">
              Disponivel para projetos
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
