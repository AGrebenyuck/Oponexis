export async function getHeroReviews() {
	try {
		const base = process.env.NEXT_PUBLIC_CRM_API_URL

		if (!base) return null

		const res = await fetch(`${base}/api/public/reviews?limit=24&minRating=4`, {
			next: { revalidate: 1800 },
		})

		const json = await res.json()

		if (!json?.success) return null

		return json.data
	} catch {
		return null
	}
}
