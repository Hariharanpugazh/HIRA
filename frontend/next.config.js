/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  env: {
    BACKEND_URL: process.env.BACKEND_URL || "http://localhost:8000",
  },
  // Increase body size limit for file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

module.exports = nextConfig;