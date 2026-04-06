import React from "react"
import type { Metadata } from 'next'
import { Instrument_Sans, Instrument_Serif, JetBrains_Mono, Fira_Code } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const instrumentSans = Instrument_Sans({ 
  subsets: ["latin"],
  variable: '--font-instrument'
});

const instrumentSerif = Instrument_Serif({ 
  subsets: ["latin"],
  weight: "400",
  variable: '--font-instrument-serif'
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: '--font-jetbrains'
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: '--font-fira-code'
});

export const metadata: Metadata = {
  metadataBase: new URL("https://alexandrebelo.com.br"),
  title: "Alexandre Belo | Design Engineer",
  description: "Design Engineer. Produtos digitais completos do design ao deploy. Portfolio real em fintech, health, gov, DeFi e monitoramento.",
  keywords: ["design engineer", "IA", "automacao", "vibe coding", "full-stack", "react", "next.js"],
  authors: [{ name: "Alexandre Belo" }],
  alternates: {
    canonical: "https://alexandrebelo.com.br",
  },
  openGraph: {
    title: "Alexandre Belo | Design Engineer",
    description: "Produtos digitais completos. Do design ao deploy.",
    url: "https://alexandrebelo.com.br",
    siteName: "Alexandre Belo",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alexandre Belo | Design Engineer",
    description: "Produtos digitais completos. Do design ao deploy.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${instrumentSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} ${firaCode.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
