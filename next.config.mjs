/** @type {import('next').NextConfig} */
const nextConfig = {
	poweredByHeader: false,
	compress: true,
	images: {
		formats: ['image/avif', 'image/webp'],
		minimumCacheTTL: 60 * 60 * 24 * 30,
	},
	experimental: {
		optimizePackageImports: ['lucide-react', '@ant-design/icons'],
	},
	async rewrites() {
		const crmApiUrl = (process.env.CRM_API_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
		return [
			{
				source: '/crm-api/:path*',
				destination: `${crmApiUrl}/:path*`,
			},
		]
	},
	async headers() {
		return [
			{
				source: '/:all*(svg|jpg|jpeg|png|webp|avif|ico|woff2)',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, max-age=31536000, immutable',
					},
				],
			},
		]
	},
}

export default nextConfig
