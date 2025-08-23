/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'output: export' to enable API routes and server-side features
  images: {
    unoptimized: true
  },
  // Disable trailing slash for compatibility
  trailingSlash: false,
  // Keep default build directory for server mode
  // distDir: '.next'
};

export default nextConfig;