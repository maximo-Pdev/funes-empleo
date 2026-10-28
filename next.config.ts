import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["pdfkit"],
  outputFileTracingIncludes: {
    "/api/admin/exports/operations.pdf": ["./public/fonts/funes/be-vietnam-400.ttf", "./public/fonts/funes/be-vietnam-700.ttf"],
    "/api/candidate/cv": ["./public/fonts/funes/be-vietnam-400.ttf"],
    "/api/candidate/applications": ["./public/fonts/funes/be-vietnam-400.ttf"],
  },
};
export default nextConfig;
