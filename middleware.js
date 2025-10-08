// middleware.js
import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// ЕДИНСТВЕННЫЙ middleware: default export от Clerk
export default clerkMiddleware((auth, req) => {
	const { pathname } = req.nextUrl

	// Разрешаем индексировать только главную страницу
	const isHome = pathname === '/' || pathname === ''
	const res = NextResponse.next()

	if (!isHome) {
		// Для всех остальных путей: noindex
		res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
	}

	return res
})

// Важно: один matcher и он же для Clerk, и для наших заголовков
export const config = {
	matcher: [
		// матчим всё кроме статики и системных путей
		'/((?!_next/|images/|fonts/|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)$).*)',
		// и явно — корень
		'/',
		// и API
		'/(api|trpc)(.*)',
	],
}
