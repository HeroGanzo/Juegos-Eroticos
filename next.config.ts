import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "juegosparaelganso.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "blob.vercel-storage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pub-*.vercel-storage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "player.vimeo.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
