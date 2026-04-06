"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");

    try {
      const { error } = await supabase
        .from("subscribers")
        .insert({ email });

      if (error) {
        if (error.code === "23505") {
          // Duplicate email — treat as success
          setStatus("success");
        } else {
          setStatus("error");
        }
      } else {
        setStatus("success");
      }
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="border-t border-border/50 pt-8 mt-12">
      <h3 className="font-offbit text-base text-accent tracking-wider uppercase mb-4">
        Newsletter
      </h3>
      <p className="text-muted-foreground text-sm mb-4">
        Receba novos artigos direto no email. Sem spam. Sem hype.
      </p>

      {status === "success" ? (
        <p className="text-primary font-offbit text-sm">
          Inscrito. Voce recebera os proximos artigos.
        </p>
      ) : status === "error" ? (
        <p className="text-accent font-offbit text-sm">
          Erro ao inscrever. Tente novamente.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            className="flex-1 bg-card border border-border/50 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
          <Button
            type="submit"
            disabled={status === "loading"}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 font-bold cursor-pointer"
          >
            {status === "loading" ? "..." : <ArrowRight className="w-4 h-4" />}
          </Button>
        </form>
      )}
    </div>
  );
}
