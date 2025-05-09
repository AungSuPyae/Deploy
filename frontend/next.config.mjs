// frontend/next.config.mjs
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "src"),
    };
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5,
  },
  trailingSlash: true,
  output: 'export', 

  exportPathMap: async function (defaultPathMap, { dev, dir, outDir, distDir, buildId }) {
    const filteredPaths = {};
    for (const [path, page] of Object.entries(defaultPathMap)) {
      if (!path.includes('/adminUI/') && !path.includes('/components/')) {
        filteredPaths[path] = page;
      }
    }
    return filteredPaths;
  }
};

export default nextConfig;