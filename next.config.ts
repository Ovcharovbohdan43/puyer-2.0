import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  outputFileTracingIncludes: {
    "/api/invoices/[id]/pdf": ["./lib/pdf/fonts/**/*"],
    "/api/public/invoices/[publicId]/pdf": ["./lib/pdf/fonts/**/*"],
  },
};

export default nextConfig;
