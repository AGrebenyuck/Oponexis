function getCrmBase() {
	const base = process.env.NEXT_PUBLIC_CRM_API_URL || process.env.CRM_API_URL || ''
	return base.replace(/\/$/, '')
}

export function crmUrl(path) {
	const base = getCrmBase()
	if (!base) return path
	return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export async function crmFetch(path, options = {}) {
	const res = await fetch(crmUrl(path), options)
	return res
}

export async function getServices() {
	const res = await crmFetch('/api/public/services', {
		next: { revalidate: 300 },
	})

	if (!res.ok) {
		throw new Error(`CRM services failed: ${res.status}`)
	}

	const json = await res.json()
	const prices = json?.prices || json?.data || []

	return {
		success: json?.success !== false,
		prices,
		data: prices,
	}
}
