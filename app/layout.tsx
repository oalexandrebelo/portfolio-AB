import React from "react"
import type { Metadata } from 'next'
import { Sora, Fira_Code } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const sora = Sora({
  subsets: ["latin"],
  variable: '--font-sora',
  display: 'block',
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: '--font-fira-code',
  display: 'block',
});

export const metadata: Metadata = {
  metadataBase: new URL("https://alexandrebelo.com.br"),
  title: {
    default: "Alexandre Belo | Design Engineer",
    template: "%s | Alexandre Belo",
  },
  description: "Design Engineer. Produtos digitais completos do design ao deploy. Portfolio real em fintech, health, gov, DeFi e monitoramento.",
  keywords: ["design engineer", "IA", "automacao", "vibe coding", "full-stack", "react", "next.js", "produto digital", "Alexandre Belo"],
  authors: [{ name: "Alexandre Belo" }],
  creator: "Alexandre Belo",
  publisher: "Alexandre Belo",
  alternates: {
    canonical: "https://alexandrebelo.com.br",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-dark-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Alexandre Belo | Design Engineer",
    description: "Produtos digitais completos. Do design ao deploy. Com IA aplicada na pratica.",
    url: "https://alexandrebelo.com.br",
    siteName: "Alexandre Belo",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/logo-ab.svg",
        width: 1000,
        height: 1000,
        alt: "Alexandre Belo - Design Engineer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alexandre Belo | Design Engineer",
    description: "Produtos digitais completos. Do design ao deploy. Com IA aplicada na pratica.",
    images: ["/logo-ab.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${sora.variable} ${firaCode.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
