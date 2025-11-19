// middleware.js (JS)
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublic = createRouteMatcher([
	'/', // главная
	'/favicon.ico',
	'/robots.txt',
	'/sitemap.xml',
	'/opengraph(.*)',
	'/icon(.*)',
	'/apple-icon(.*)',
	'/_next/(.*)', // статика Next
	'/images/(.*)',
	'/fonts/(.*)',
	'/partners', // если есть индекс
	'/partners/(.*)', // /partners/[code] и пр.
	'/admin/(.*)', // /partners/[code] и пр.
	'/order',
	'/sms-redirect',
])

export default clerkMiddleware(async (auth, req) => {
	const ua = req.headers.get('user-agent') || ''
	const isBot =
		/Googlebot|Bingbot|DuckDuckBot|Yandex|facebookexternalhit|Twitterbot|LinkedInBot/i.test(
			ua
		)

	// Публичное и боты — пропускаем
	if (isPublic(req) || isBot) return

	// Остальное (НЕ /api, см. matcher ниже) — защищаем
	await auth.protect()
})

export const config = {
	// не трогаем api вообще
	matcher: ['/((?!api|.*\\..*|_next).*)', '/'],
}
