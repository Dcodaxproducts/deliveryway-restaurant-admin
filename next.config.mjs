import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: rootDirectory,
  },
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
};

export default nextConfig;
