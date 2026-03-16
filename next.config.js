/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingExcludes: {
    "/photography/[category]": ["./public/photography/**/*"],
  },
};

export default nextConfig;
