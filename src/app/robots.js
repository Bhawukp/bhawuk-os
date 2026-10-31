import { siteUrl } from "@/config/flags";

export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
