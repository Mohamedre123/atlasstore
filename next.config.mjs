/** @type {import('next').NextConfig} */
const nextConfig = {
  /* بيشيل شارة Next.js (حرف N) اللي بتظهر تحت في وضع التطوير */
  devIndicators: false,

  images: {
    // نسمح بتحميل صور المنتجات من أي دومين، لأن صور الدروب شيبينج
    // بتيجي من منصات مختلفة (شوبيفاي، سلة، علي إكسبرس... إلخ)
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
}

export default nextConfig
