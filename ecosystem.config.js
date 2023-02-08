module.exports = {
  apps : [
    {
      name: "streetby-merchant",
      script: "npx",
      interpreter: "none",
      args: "serve build -s -p 8300",
      env_production: {
        "NODE_ENV": "production",
        "BASE_URL": "https://merchant.streetby.com",
      },
      env_staging: {
        "NODE_ENV": "staging",
        "BASE_URL": "https://mw.streetby.com"
      },
      env_development: {
        "NODE_ENV": "development",
        "BASE_URL": "http://localhost:3000",
      }
    }
  ]
}