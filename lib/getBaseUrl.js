export function getBaseUrl() {
	if (typeof window !== 'undefined') {
		return window.location.origin
	}

	return process.env.NEXT_PUBLIC_SITE_URL || 'https://oponexis.pl'
}
