import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components / Partial Prerendering disattivati: l'app legge i dati nel
  // browser da Supabase e non ne trae vantaggio, mentre l'adapter OpenNext per
  // Cloudflare Workers non li supporta ancora (le pagine restano in attesa).
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
