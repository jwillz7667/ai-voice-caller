module.exports = {
  apps : [{
    name   : "webapp",
    script : "node_modules/.bin/next",
    args   : "start",
    cwd    : "/srv/www/snapstyleboutique.com/app/webapp",
    env_production: {
      "NODE_ENV": "production",
      "PORT": process.env.WEBAPP_PORT || 3000
    }
  }]
};