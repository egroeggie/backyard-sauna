import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Tent hire is paused along with the pop-ups (temporary, so not cached as permanent).
      { source: "/rental", destination: "/events", permanent: false },
    ];
  },
};

export default nextConfig;
