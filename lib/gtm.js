export function trackEvent(eventName, payload = {}) {
	try {
		if (typeof window === 'undefined') return
		if (!eventName || typeof eventName !== 'string') return
		if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return

		window.dataLayer = window.dataLayer || []
		window.dataLayer.push({ ...payload, event: eventName })

		// Лог только в dev — чтобы не мешать в проде
		if (process.env.NODE_ENV === 'development') {
			console.info('[GTM event]', eventName)
		}
	} catch (err) {
		console.warn('[GTM event failed]', err)
	}
}
