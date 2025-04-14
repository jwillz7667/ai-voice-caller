module.exports = {
  apps : [{
    name   : "webapp",
    script : "node_modules/.bin/next",
    args   : "start -p 3000", // Start Next.js on port 3000
    cwd    : "/srv/www/viral-ventures-llc.com/app/webapp", // Set the working directory
    env: {
      // Environment Configuration
      "NODE_ENV": "production",
      "PORT": 3000, // Port Next.js will listen on

      // Public URLs (Passed to Frontend)
      "NEXT_PUBLIC_WEBSOCKET_URL": "wss://viral-ventures-llc.com/ws",
      "NEXT_PUBLIC_API_BASE_URL": "https://viral-ventures-llc.com",

      // Public Keys (Passed to Frontend)
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY": "pk_live_your_stripe_publishable_key", // e.g., process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

      // Twilio (Assuming these are needed server-side by Next.js API routes, otherwise might not be needed here)
      // Load from server environment variables if possible
      "TWILIO_ACCOUNT_SID": "your_twilio_account_sid", // e.g., process.env.TWILIO_ACCOUNT_SID
      "TWILIO_AUTH_TOKEN": "your_twilio_auth_token", // e.g., process.env.TWILIO_AUTH_TOKEN
      "TWILIO_PHONE_NUMBER": "your_twilio_phone_number" // e.g., process.env.TWILIO_PHONE_NUMBER
    }
  }]
}; 