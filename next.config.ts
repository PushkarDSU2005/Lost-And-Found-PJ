import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Next.js requires unsafe-eval for HMR in development
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Tailwind requires unsafe-inline for styles
              "style-src 'self' 'unsafe-inline'",
              // Allow images from Supabase storage and data URIs
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              // Allow connections to Supabase and Vercel Live
              `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://*.supabase.co'} https://vercel.live wss://*.supabase.co`,
              // Prevent framing (clickjacking protection)
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              // Upgrade insecure requests to HTTPS
              "upgrade-insecure-requests"
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          }
        ]
      }
    ]
  }
};

export default nextConfig;
