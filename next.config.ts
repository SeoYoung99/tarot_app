import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  api: {
    bodyParser: {
      sizeLimit: '5mb', // 이미지 크기에 따라 필요에 맞게 조정 가능
    },
  },
};

export default nextConfig;
