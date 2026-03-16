/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingExcludes: {
      "/photography/[category]": ["./public/photography/**/*"],
    },
  },
};

export default nextConfig;
