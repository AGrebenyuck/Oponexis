export function getBaseUrl() {
	if (typeof window !== 'undefined') {
		// на клиенте — берём реально открытый домен
		return window.location.origin
	}

	// на сервере
	return process.env.NEXT_PUBLIC_SITE_URL || 'https://oponexis.pl'
}
