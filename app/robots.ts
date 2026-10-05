import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/blog/admin", "/estudos", "/api/internal"] }, sitemap: "https://alexandrebelo.com.br/sitemap.xml" };
}
