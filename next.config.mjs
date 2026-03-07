/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Speeds up production builds; lint can run separately in CI/editor.
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark as external so webpack never tries to bundle/resolve this ESM-only package.
      // It will be loaded by Node.js require() at runtime instead.
      const existing = Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean);
      config.externals = [...existing, '@next-auth/firebase-adapter'];
    }
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      // Firebase Storage
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: '*.appspot.com' },
      // Firebase Hosting (if used)
      { protocol: 'https', hostname: '*.firebaseapp.com' },
    ],
  },
};

export default nextConfig;

