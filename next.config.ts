import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  serverExternalPackages: ["@react-pdf/renderer"],
  outputFileTracingIncludes: {
    "/api/invoices/[id]/pdf": ["./lib/pdf/fonts/**/*"],
    "/api/public/invoices/[publicId]/pdf": ["./lib/pdf/fonts/**/*"],
  },
};

export default nextConfig;
