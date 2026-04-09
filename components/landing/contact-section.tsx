"use client";

import { ArrowRight, Mail, Phone, MapPin } from "lucide-react";
import { GradientButton } from "./gradient-button";

export function ContactSection() {
  return (
    <section id="contato" className="py-32 lg:py-40 border-t border-border/50 bg-primary text-primary-foreground">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          <div>
            <span className="inline-flex items-center gap-3 font-offbit text-base lg:text-lg text-primary-foreground/50 tracking-wider uppercase mb-6">
              <span className="w-12 h-px bg-primary-foreground/30" />
              Contato
            </span>
            <h2 className="text-4xl lg:text-6xl font-black leading-tight mb-8">
              Tem algo que precisa sair do papel?
            </h2>
            <p className="text-lg text-primary-foreground/60 leading-relaxed mb-12 max-w-lg">
              Produto, automacao, treinamento, monitoramento ou posicionamento digital. Eu executo. Direto, com stack limpa e foco no que precisa rodar.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <GradientButton href="https://wa.me/5564999271254">
                Falar no WhatsApp
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </GradientButton>
              <GradientButton href="mailto:contato@alexandrebelo.com.br" variant="outline">
                Enviar email
              </GradientButton>
            </div>
          </div>

          <div className="space-y-8 lg:pt-12">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary-foreground/60" />
              </div>
              <div>
                <p className="font-offbit text-sm text-primary-foreground/40">Email</p>
                <a href="mailto:contato@alexandrebelo.com.br" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-base">
                  contato@alexandrebelo.com.br
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary-foreground/60" />
              </div>
              <div>
                <p className="font-offbit text-sm text-primary-foreground/40">WhatsApp</p>
                <a href="https://wa.me/5564999271254" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-base">
                  +55 (64) 99927-1254
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary-foreground/60" />
              </div>
              <div>
                <p className="font-offbit text-sm text-primary-foreground/40">Local</p>
                <p className="text-primary-foreground/80 text-base">Goias, Brasil</p>
              </div>
            </div>

            <div className="pt-4 flex gap-8">
              <a href="https://www.linkedin.com/in/alexandrebelo" target="_blank" rel="noopener noreferrer" className="font-offbit text-base text-primary-foreground/40 hover:text-primary-foreground transition-colors">
                LinkedIn
              </a>
              <a href="https://github.com/oalexandrebelo" target="_blank" rel="noopener noreferrer" className="font-offbit text-base text-primary-foreground/40 hover:text-primary-foreground transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
