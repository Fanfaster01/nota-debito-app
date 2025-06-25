import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    '172.28.67.54', // WSL network IP
    'localhost',
    '127.0.0.1',
    '0.0.0.0'
  ]
};

export default nextConfig;
