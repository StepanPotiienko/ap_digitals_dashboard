import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow ngrok and other tunnel origins when showcasing to clients (dev only)
  allowedDevOrigins: [
    "localhost",
    "*.ngrok.io",
    "*.ngrok-free.app",
    "*.ngrok.app",
  ],
};

export default nextConfig;
