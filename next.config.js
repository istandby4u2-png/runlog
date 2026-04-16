/** @type {import('next').NextConfig} */
const nextConfig = {
  // satori 카드: 런타임은 public/fonts/instagram-card 우선 + 폰트 트레이싱 백업
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': [
        './node_modules/@fontsource/noto-sans-kr/files/**/*.woff',
        './public/fonts/instagram-card/**/*.woff',
      ],
    },
  },
  images: {
    domains: ['localhost'],
  },
  // Google Identity Services(OAuth 팝업)와 창 간 통신 — GIS 문서 권장
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
