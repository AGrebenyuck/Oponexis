export function gtmPush(payload) {
	try {
		if (typeof window === 'undefined') return
		if (!payload || typeof payload !== 'object') return

		window.dataLayer = window.dataLayer || []
		window.dataLayer.push(payload)

		// Лог только в dev — чтобы не мешать в проде
		if (process.env.NODE_ENV === 'development') {
			console.info('[GTM push]', payload)
		}
	} catch (err) {
		console.warn('[GTM push failed]', err)
	}
}
