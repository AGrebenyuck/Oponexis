// lib/googleReviewsServer.js
export async function getHeroReviews() {
	try {
		const base = process.env.URL || ''
		const res = await fetch(`${base}/api/google-reviews?limit=24&minRating=4`, {
			// можно поставить 600–1800 сек, если хочешь небольшой ISR:
			// next: { revalidate: 600 }
			cache: 'no-store',
		})
		const json = await res.json()
		if (!json?.ok) return null
		const onlyText = (json.reviews || []).filter(
			r => (r.text || '').trim().length > 0
		)
		return {
			rating: json.rating,
			total: json.total,
			url: json.url,
			reviews: onlyText,
		}
	} catch {
		return null
	}
}
