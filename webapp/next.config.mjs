/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },
  // Disable trailing slash for Netlify compatibility
  trailingSlash: false,
  distDir: 'out',
  
  // Add exportPathMap to explicitly control what gets exported
  exportPathMap: async function() {
    // Define the pages to export (exclude API routes)
    return {
      '/': { page: '/' },
      // Add other specific pages you want to include in static export
      // API routes will be automatically excluded
    }
  }
};

export default nextConfig;
