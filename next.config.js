/** @type {import('next').NextConfig} */
const nextConfig = {
  // SIN output: 'export' - esto es importante
  trailingSlash: false, // Puede ser true o false
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig