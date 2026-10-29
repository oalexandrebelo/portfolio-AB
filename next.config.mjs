/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [{ source: "/v2", destination: "/v2/index.html" }]
  },
  async redirects() {
    return [
      // Canonicalize www -> apex (non-www) to consolidate SEO signals.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.alexandrebelo.com.br" }],
        destination: "https://alexandrebelo.com.br/:path*",
        permanent: true,
      },
      // Prévias estáticas das LPs V8/V10/V11 (noindex). As páginas usam assets relativos
      // (assets/..., ./assets/...), então a URL do documento precisa terminar no index.html:
      // um rewrite como o da V2 serviria o HTML em /vN e os assets resolveriam em /assets/.
      // Com trailingSlash=false, /vN/ -> /vN (Next) -> /vN/index.html (aqui).
      ...["/v8", "/v8/blog", "/v8/blog/10-ferramentas-ia", "/v8/atelier",
          "/v10", "/v10/blog", "/v10/blog/10-ferramentas-ia",
          "/v11", "/v11/blog", "/v11/blog/10-ferramentas-ia"].map((source) => ({
        source,
        destination: `${source}/index.html`,
        permanent: false,
      })),
    ]
  },
}

export default nextConfig
