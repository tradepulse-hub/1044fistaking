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
  webpack(config) {
    // Stub de módulos só disponíveis em React-Native ou ambiente CLI
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
    };
    return config;
  }
}

export default nextConfig
