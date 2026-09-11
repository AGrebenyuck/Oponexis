const STORAGE_KEY = 'opx_first_touch_v1'
const MAX_AGE_DAYS = 180

function clean(value, max = 1000) {
	const text = String(value || '').trim()
	return text ? text.slice(0, max) : null
}

function readStored() {
	if (typeof window === 'undefined') return null
	try {
		const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')
		return parsed && typeof parsed === 'object' ? parsed : null
	} catch {
		return null
	}
}

function inferSource(params, referrer) {
	if (params.get('utm_source')) return params.get('utm_source')
	if (params.get('gclid') || params.get('wbraid') || params.get('gbraid')) return 'google'
	if (params.get('fbclid')) return 'facebook'
	if (params.get('ttclid')) return 'tiktok'
	if (params.get('msclkid')) return 'bing'
	try {
		const host = referrer ? new URL(referrer).hostname.toLowerCase() : ''
		if (host.includes('google.')) return 'google'
		if (host.includes('facebook.') || host.includes('instagram.')) return 'facebook'
		if (host.includes('tiktok.')) return 'tiktok'
		if (host.includes('youtube.')) return 'youtube'
		return host || 'direct'
	} catch {
		return 'direct'
	}
}

function inferMedium(params, referrer) {
	if (params.get('utm_medium')) return params.get('utm_medium')
	if (params.get('gclid') || params.get('wbraid') || params.get('gbraid') || params.get('fbclid') || params.get('ttclid') || params.get('msclkid')) {
		return 'cpc'
	}
	return referrer ? 'referral' : 'direct'
}

export function canonicalSourceFromAttribution(attribution) {
	const source = clean(attribution?.source, 191)?.toLowerCase() || ''
	const medium = clean(attribution?.medium, 191)?.toLowerCase() || ''
	if (source.includes('google_maps') || source === 'maps') return 'Google Maps'
	if (attribution?.gclid || source.includes('google') && /(cpc|ppc|paid|ads?)/.test(medium)) {
		return 'Google Ads'
	}
	if (attribution?.fbclid || /(facebook|instagram|meta)/.test(source) && /(cpc|paid|ads?)/.test(medium)) {
		return 'Facebook Ads'
	}
	if (attribution?.ttclid || /(tiktok|youtube)/.test(source)) return 'TikTok / YouTube'
	if (source.includes('qr')) return 'Wizytówka / QR'
	if (/(partner|b2b)/.test(source)) return 'B2B / partner'
	if (/(referral|polecen|znajom)/.test(source)) return 'Polecenie / znajomi'
	if (/(offline|bus|van|car|auto)/.test(source)) return 'Oklejony samochód'
	if (source.includes('google')) return 'Wyszukiwarka Google'
	if (/(facebook|instagram)/.test(source)) return 'Facebook / Instagram'
	return 'Inne'
}

function hasMarketingSignal(params) {
	return [
		'utm_source',
		'utm_medium',
		'utm_campaign',
		'gclid',
		'wbraid',
		'gbraid',
		'fbclid',
		'ttclid',
		'msclkid',
	].some(key => Boolean(params.get(key)))
}

function buildAttribution() {
	const params = new URLSearchParams(window.location.search)
	const referrer = document.referrer || ''
	return {
		signal: hasMarketingSignal(params),
		value: {
			source: clean(inferSource(params, referrer), 191),
			medium: clean(inferMedium(params, referrer), 191),
			campaign: clean(params.get('utm_campaign'), 191),
			content: clean(params.get('utm_content'), 191),
			term: clean(params.get('utm_term'), 191),
			referrer: clean(referrer),
			landingPage: clean(`${window.location.pathname}${window.location.search}`),
			gclid: clean(params.get('gclid'), 191),
			wbraid: clean(params.get('wbraid'), 191),
			gbraid: clean(params.get('gbraid'), 191),
			fbclid: clean(params.get('fbclid'), 191),
			ttclid: clean(params.get('ttclid'), 191),
			msclkid: clean(params.get('msclkid'), 191),
			capturedAt: new Date().toISOString(),
		},
	}
}

export function captureFirstTouch() {
	if (typeof window === 'undefined') return null
	const existing = readStored()
	const current = buildAttribution()
	if (existing && !current.signal) return existing
	const attribution = current.value

	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution))
		const expires = new Date(Date.now() + MAX_AGE_DAYS * 86400000).toUTCString()
		document.cookie = `${STORAGE_KEY}=1;expires=${expires};path=/;SameSite=Lax`
	} catch {}
	return attribution
}

export function getFirstTouch() {
	return captureFirstTouch()
}
