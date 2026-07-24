import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  transpilePackages: [
    '@diaspora-trust/core-logic',
    '@diaspora-trust/shared-ui',
    'react-map-gl',
    'mapbox-gl',
  ],
};

export default nextConfig;
