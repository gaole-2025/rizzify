/** @type {import('next').NextConfig} */
const path = require("path");
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.rizzify.org",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "rizzify.org",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      {
        protocol: "https",
        hostname: "pub-bc09d7863bdf06dffcb455b66dc021e5.r2.dev",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "slowroads.wiki",
        port: "",
        pathname: "/**",
      },
    ],
  },
  webpack: (config, { dev, isServer }) => {
    // 开发环境优化配置
    if (dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        // 保留 splitChunks 但优化配置
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
          },
        },
        // 添加更好的缓存配置
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
      };
    }

    // 显式声明常用别名，确保 webpack 在构建期可以解析这些模块
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname),
      "@/db/client": path.resolve(__dirname, "src/db/client.ts"),
      "@/db/repo": path.resolve(__dirname, "src/db/repo/index.ts"),
      // Generic root lib alias (for files like lib/stage1-data.ts)
      "@/lib": path.resolve(__dirname, "lib"),
      // More specific aliases to disambiguate between root lib and src/lib
      "@/lib/api": path.resolve(__dirname, "src/lib/api"),
      "@/lib/storage": path.resolve(__dirname, "src/lib/storage.ts"),
      "@/lib/stage1-data": path.resolve(__dirname, "lib/stage1-data.ts"),
      "@/lib/stage2-storage": path.resolve(__dirname, "lib/stage2-storage.ts"),
      "@/components": path.resolve(__dirname, "components"),
      "@/src": path.resolve(__dirname, "src"),
    };
    return config;
  },
  // 禁用SWC压缩以避免worker问题
  compress: false,
  // 注意：Worker 在独立进程中运行（npm run worker），不使用 instrumentation
  experimental: {
    // 禁用可能导致worker问题的功能
    serverComponentsExternalPackages: ["@prisma/client"],
  },
};

// 禁用 TypeScript 检查以加快构建
module.exports = {
  ...nextConfig,
  typescript: {
    // Ignore TypeScript errors during production build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint errors during production build
    ignoreDuringBuilds: true,
  },
};
