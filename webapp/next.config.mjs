/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },
  // Disable trailing slash for Netlify compatibility
  trailingSlash: false,
  distDir: 'out'
};

export default nextConfig;
