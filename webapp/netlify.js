module.exports = {
  // Needed for serverless functions
  trailingSlash: true,
  // Target must be serverless
  target: 'serverless',
  // Ensure the public directory is used directly
  // This is crucial for the static export to function correctly on Netlify
  images: {
    loader: 'imgix',
    path: '',
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        destination: '/:path*/',
        permanent: true,
      },
    ]
  },
} 