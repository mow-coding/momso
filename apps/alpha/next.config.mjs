/** @type {import('next').NextConfig} */
const nextConfig = {
  // 알파: 빌드 차단 방지(린트는 별도). 타입은 dev에서 검증.
  eslint: { ignoreDuringBuilds: true },
}

export default nextConfig
