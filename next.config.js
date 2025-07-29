/** @type {import('next').NextConfig} */
const nextConfig = {
  // Retirer output: 'export' pour permettre les routes dynamiques
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
