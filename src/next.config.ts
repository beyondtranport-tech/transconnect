/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    // This is the new, more secure way to pass the full service account key.
    FIREBASE_ADMIN_SDK_CONFIG_B64: process.env.FIREBASE_ADMIN_SDK_CONFIG_B64,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
  devServer: {
    allowedDevOrigins: ["*.cloudworkstations.dev"],
  },
};

module.exports = nextConfig;
