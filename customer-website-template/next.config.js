/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    RESTAURANT_ID: process.env.RESTAURANT_ID,
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3550',
  },
}

module.exports = nextConfig 