/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    "http://localhost:3000",
    "https://*.ngrok-free.app", // Adicione o seu domínio Ngrok aqui
    // Adicione outros domínios de desenvolvimento se necessário
  ],
}

export default nextConfig
