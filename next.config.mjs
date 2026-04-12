/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["firebase-admin"],
  },
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: "https://talentwick-ba718.firebaseapp.com/__/auth/:path*",
      },
    ];
  },
};

export default nextConfig;
