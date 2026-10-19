import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(process.cwd()),
  async redirects() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (!appUrl) return [];
    try {
      const u = new URL(appUrl);
      if (!u.hostname.startsWith("www.")) return [];
      const apex = u.hostname.replace(/^www\./, "");
      return [
        {
          source: "/:path*",
          has: [{ type: "host", value: apex }],
          destination: `${u.origin}/:path*`,
          permanent: true,
        },
      ];
    } catch {
      return [];
    }
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "unsafe-none",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
