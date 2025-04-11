module.exports = {
    apps : [{
      name   : "websocket-server",
      script : "dist/server.js",
      cwd    : "/srv/www/snapstyleboutique.com/app/websocket-server",
      env_production: {
        "NODE_ENV": "production",
        "PORT": process.env.WEBSOCKET_PORT || 8080,
        "ALLOWED_ORIGIN": process.env.ALLOWED_ORIGIN || "https://snapstyleboutique.com",
        "PUBLIC_URL": process.env.PUBLIC_URL || "https://snapstyleboutique.com",
        "OPENAI_API_KEY": process.env.OPENAI_API_KEY,
        "TWILIO_ACCOUNT_SID": process.env.TWILIO_ACCOUNT_SID,
        "TWILIO_AUTH_TOKEN": process.env.TWILIO_AUTH_TOKEN,
        "TWILIO_PHONE_NUMBER": process.env.TWILIO_PHONE_NUMBER
      }
    }]
  }; 