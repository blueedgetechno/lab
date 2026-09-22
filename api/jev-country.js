const { createCountrySearchHandler } = require("../jev-country/server.cjs")

const allowedOrigins = process.env.VERCEL === "1" ? [
  ...[process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
    .filter(Boolean)
    .map(host => `https://${host}`),
  ...(process.env.JEV_ALLOWED_ORIGINS || "").split(",").map(origin => origin.trim()).filter(Boolean),
] : undefined

module.exports = createCountrySearchHandler({ allowedOrigins })