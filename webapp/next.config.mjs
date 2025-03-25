/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },
  // This is important for Netlify deployment to handle client-side routing
  trailingSlash: true
};

export default nextConfig;
