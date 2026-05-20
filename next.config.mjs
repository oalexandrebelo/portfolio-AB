/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
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
    ]
  },
}

export default nextConfig
