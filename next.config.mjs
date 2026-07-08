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
