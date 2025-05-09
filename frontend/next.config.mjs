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
  // Keep your existing config
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // Keep ignoring TypeScript errors during build
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5,
  },
  
  // Add these new configurations
  trailingSlash: true,
  
  // Add export path map to exclude problematic routes
  exportPathMap: async function (defaultPathMap, { dev, dir, outDir, distDir, buildId }) {
    // Create a filtered version of the default paths
    const filteredPaths = {};
    
    // Only include non-admin, non-component paths in static generation
    for (const [path, page] of Object.entries(defaultPathMap)) {
      if (!path.includes('/adminUI/') && !path.includes('/components/')) {
        filteredPaths[path] = page;
      }
    }
    
    return filteredPaths;
  }
};

export default nextConfig;