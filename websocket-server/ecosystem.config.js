module.exports = {
  apps : [{
    name   : "websocket-server",
    script : "dist/server.js", // Assuming your build output is dist/server.js
    cwd    : "/srv/www/viral-ventures-llc.com/app/websocket-server", // Set the working directory
    env: {
      // Environment Configuration
      "NODE_ENV": "production",
      "PORT": 8080,
      "ALLOWED_ORIGIN": "https://viral-ventures-llc.com",
      "PUBLIC_URL": "https://viral-ventures-llc.com",

      // Secrets & Keys (Replace placeholders or load from server env vars)
      "OPENAI_API_KEY": "your_openai_api_key", // e.g., process.env.OPENAI_API_KEY
      "SUPABASE_URL": "your_supabase_project_url", // e.g., process.env.SUPABASE_URL
      "SUPABASE_SERVICE_KEY": "your_supabase_service_role_key", // e.g., process.env.SUPABASE_SERVICE_KEY
      "STRIPE_SECRET_KEY": "sk_live_your_stripe_secret_key", // e.g., process.env.STRIPE_SECRET_KEY
      "STRIPE_PUBLISHABLE_KEY": "pk_live_your_stripe_publishable_key", // e.g., process.env.STRIPE_PUBLISHABLE_KEY
      "STRIPE_WEBHOOK_SECRET": "whsec_your_stripe_webhook_signing_secret", // e.g., process.env.STRIPE_WEBHOOK_SECRET

      // Application Specific Config
      "CREDIT_COST_PER_CALL": "1" // Example value
    }
  }]
}; 