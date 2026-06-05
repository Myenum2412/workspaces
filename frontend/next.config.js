const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "workspaceapi.myenum.in",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pub-819cf41d8e124578a1663118cf94cf98.r2.dev",
        pathname: "/**",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
