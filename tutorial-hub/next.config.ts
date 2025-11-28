import type { NextConfig } from "next";

// Keep the basePath only in production so local `next dev` serves at `/`.
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  basePath: isProd ? "/TutorialHub" : undefined,
  output: "export"
};

export default nextConfig;
