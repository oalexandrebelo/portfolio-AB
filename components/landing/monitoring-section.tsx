"use client";

import { Radio, BarChart3, Gauge, Network, Cpu } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";

const capabilities = [
  { icon: Radio, label: "Monitoramento de radares e equipamentos rodoviarios" },
  { icon: BarChart3, label: "Zabbix (coleta) + Grafana (dashboards customizados)" },
  { icon: Gauge, label: "API propria para conversao de protocolos SNMP" },
  { icon: Network, label: "Dispositivos fora do Mini ITX: lacos, cameras, displays" },
  { icon: Cpu, label: "Consultoria em smart cities e IoT" },
];

export function MonitoringSection() {
  const { ref, isVisible } = useInView(0.1);

  return (
    <section id="monitoramento" ref={ref} className="py-32 lg:py-40 border-t border-border/50 bg-secondary/30">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          <div>
            <span className="inline-flex items-center gap-3 font-offbit text-base lg:text-lg text-accent tracking-wider uppercase mb-6">
              <span className="w-12 h-px bg-accent/50" />
              Monitoramento & Smart Cities
            </span>
            <h2 className="text-4xl lg:text-5xl font-black leading-tight mb-8">
              13+ anos em campo. <span className="text-primary">Radares, dados e infraestrutura critica.</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Zabbix para mapear, Grafana para visualizar. Protocolos SNMP com API propria
              de conversao para tratamento de dados de dispositivos fora do Mini ITX —
              lacos indutivos, cameras panoramicas, displays de lombada eletronica.
              Projeto completo: mapeamento, integracao, dashboard operacional.
            </p>

            <div className="space-y-4">
              {capabilities.map((cap, i) => {
                const Icon = cap.icon;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-4 transition-all duration-700 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                    style={{ transitionDelay: `${i * 100}ms` }}
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-foreground/80 text-base">{cap.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`space-y-4 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="rounded-2xl border border-border/50 p-6 bg-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-green-500/80 animate-pulse" />
                <span className="font-offbit text-sm text-accent tracking-wider">ZABBIX + GRAFANA — OPERACIONAL</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-16 rounded-lg bg-foreground/[0.03] border border-border/30" />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border/50 p-5 bg-card">
                <span className="font-offbit text-sm text-accent block mb-2">CASE</span>
                <p className="font-bold text-base">Itumbiara — GO</p>
                <p className="text-sm text-muted-foreground mt-1">Radares e equipamentos</p>
              </div>
              <div className="rounded-2xl border border-border/50 p-5 bg-card">
                <span className="font-offbit text-sm text-accent block mb-2">CASE</span>
                <p className="font-bold text-base">Rio Verde — GO</p>
                <p className="text-sm text-muted-foreground mt-1">Radares e equipamentos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
