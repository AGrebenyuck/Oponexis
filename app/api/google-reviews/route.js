// app/api/google-reviews/route.js
import { db } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// ── настройки ─────────────────────────────────────────────
const TTL_MS = 7 * 24 * 60 * 60 * 1000
const LOCALE = 'pl'
const DEFAULT_MIN_RATING = 4
const MAX_V1 = 10 // v1 Place Details всё равно вернёт до 5, но слайсим до 10

// опционально закрепить отзывы
const PINNED_REVIEW_IDS = [
	// 'ChZDSUhNMG9nS0VJQ0FnSUNmMWVQeV9nEAE',
]
const PINNED_AUTHORS = [
	// 'Jan Kowalski'
]

// ── нормализация ──────────────────────────────────────────
function normalizeLegacy(json) {
	const place = json?.result || {}
	const url = place?.url || place?.website || null
	const rating = place?.rating ?? null
	const total = place?.user_ratings_total ?? null
	const reviews = (place?.reviews || []).map((r, i) => ({
		id:
			r?.review_id ||
			r?.time?.toString() ||
			`${r?.author_name}-${r?.time}-${i}`,
		author_name: r?.author_name,
		profile_photo_url: r?.profile_photo_url,
		rating: Number(r?.rating || 0),
		relative_time_description: r?.relative_time_description || '',
		text: r?.text || '',
		time: r?.time ?? 0, // unix seconds
		language: r?.language || '',
		author_url: r?.author_url || '',
	}))
	return { url, rating, total, reviews, source: 'legacy' }
}

function normalizeV1(json) {
	const url = json?.googleMapsUri || null
	const rating = Number(json?.rating || 0)
	const total = Number(json?.userRatingCount || 0)
	const raw = Array.isArray(json?.reviews) ? json.reviews : []
	const reviews = raw.map((r, i) => {
		const text =
			(r?.text && typeof r.text.text === 'string' ? r.text.text : '') ||
			(r?.originalText && typeof r.originalText.text === 'string'
				? r.originalText.text
				: '') ||
			''
		// У v1 нет стабильного id, соберём детерминированный
		const id = `${
			r?.authorAttribution?.uri || r?.authorAttribution?.displayName || 'user'
		}|${r?.publishTime || i}`
		return {
			id,
			author_name: r?.authorAttribution?.displayName || 'Użytkownik Google',
			profile_photo_url: r?.authorAttribution?.photoUri || '',
			rating: Number(r?.rating || 0),
			relative_time_description: r?.relativePublishTimeDescription || '',
			text,
			time: Date.parse(r?.publishTime || '') / 1000 || 0,
			language: LOCALE,
			author_url: r?.authorAttribution?.uri || '',
		}
	})
	return { url, rating, total, reviews, source: 'v1' }
}

// ── выборка/сортировка ───────────────────────────────────
function selectReviews(all, { minRating = DEFAULT_MIN_RATING } = {}) {
	const textful = all.filter(
		r => (r.text || '').trim().length > 0 && Number(r.rating || 0) >= minRating
	)

	const pinnedById = textful.filter(r => PINNED_REVIEW_IDS.includes(r.id))
	const pinnedByAuthor = textful.filter(
		r =>
			PINNED_AUTHORS.includes(r.author_name) &&
			!PINNED_REVIEW_IDS.includes(r.id)
	)
	const pinnedIds = new Set([...pinnedById, ...pinnedByAuthor].map(r => r.id))

	const rest = textful
		.filter(r => !pinnedIds.has(r.id))
		.sort((a, b) => (b.time || 0) - (a.time || 0)) // новые выше

	return [...pinnedById, ...pinnedByAuthor, ...rest]
}

// ── fetchers ──────────────────────────────────────────────
async function fetchLegacy(placeId, key) {
	const fields = [
		'name',
		'url',
		'website',
		'rating',
		'user_ratings_total',
		'reviews',
	].join('%2C')
	const endpoint =
		`https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
			placeId
		)}` + `&language=${LOCALE}&fields=${fields}&key=${encodeURIComponent(key)}`
	const res = await fetch(endpoint, { cache: 'no-store' })
	if (!res.ok) throw new Error(`Google legacy HTTP ${res.status}`)
	const json = await res.json()
	if (json?.status !== 'OK')
		throw new Error(`Google legacy status ${json?.status}`)
	return normalizeLegacy(json)
}

async function fetchV1(placeId, key) {
	const name = placeId.startsWith('places/') ? placeId : `places/${placeId}`

	const url =
		`https://places.googleapis.com/v1/${name}` +
		`?languageCode=${encodeURIComponent(LOCALE)}` // без reviews.* — их тут нет

	const fieldMask = [
		'googleMapsUri',
		'rating',
		'userRatingCount',
		'reviews.rating',
		'reviews.relativePublishTimeDescription',
		'reviews.text',
		'reviews.originalText',
		'reviews.authorAttribution',
		'reviews.publishTime',
	].join(',')

	const res = await fetch(url, {
		method: 'GET',
		headers: {
			'X-Goog-Api-Key': key,
			'X-Goog-FieldMask': fieldMask,
		},
		cache: 'no-store',
	})

	if (!res.ok) {
		const errText = await res.text().catch(() => '')
		const e = new Error(`Places v1 HTTP ${res.status}: ${errText}`)
		e._v1_body = errText
		throw e
	}

	const json = await res.json()
	return normalizeV1(json)
}

// ── route ─────────────────────────────────────────────────
export async function GET(req) {
	try {
		const { searchParams } = new URL(req.url)
		const minRating = Number(
			searchParams.get('minRating') || DEFAULT_MIN_RATING
		)
		const limit = Math.max(
			1,
			Math.min(MAX_V1, Number(searchParams.get('limit') || MAX_V1))
		)
		const debug = searchParams.get('debug') === '1'
		const force = searchParams.get('force') === '1' // ручное обновление кэша

		const key = process.env.GOOGLE_PLACES_API_KEY
		const placeId = process.env.GOOGLE_PLACE_ID
		if (!key || !placeId) {
			return NextResponse.json(
				{ ok: false, error: 'Missing Google API env vars' },
				{ status: 500 }
			)
		}

		// читаем кэш
		const row = await db.googleReviewsCache.findUnique({
			where: { id: 'google' },
		})
		const now = Date.now()
		const stale =
			force || !row || now - new Date(row.updatedAt).getTime() > TTL_MS

		let payload = row?.payload || null
		let v1ErrorBody = null

		if (stale) {
			let fresh
			try {
				fresh = await fetchV1(placeId, key)
			} catch (e) {
				v1ErrorBody = e?._v1_body || String(e?.message || e)
				console.warn(
					'[google-reviews] v1 failed, fallback to legacy:',
					v1ErrorBody
				)
				fresh = await fetchLegacy(placeId, key)
			}

			await db.googleReviewsCache.upsert({
				where: { id: 'google' },
				create: {
					id: 'google',
					payload: fresh,
					rating: fresh.rating,
					total: fresh.total,
					url: fresh.url,
				},
				update: {
					payload: fresh,
					rating: fresh.rating,
					total: fresh.total,
					url: fresh.url,
				},
			})
			payload = fresh
		}

		// финальные данные из БД (гарантированно есть)
		const final = await db.googleReviewsCache.findUnique({
			where: { id: 'google' },
		})
		if (!final) {
			return NextResponse.json(
				{ ok: false, error: 'no-cache' },
				{ status: 500 }
			)
		}

		const norm = final.payload || {}
		let reviews = Array.isArray(norm.reviews) ? norm.reviews : []

		// только с текстом + сортировка + закрепления
		reviews = selectReviews(reviews, { minRating }).slice(0, limit)

		return NextResponse.json({
			ok: true,
			rating: final.rating ?? norm.rating ?? null,
			total: final.total ?? norm.total ?? null,
			url: final.url ?? norm.url ?? null,
			reviews,
			source: norm.source || 'unknown',
			updatedAt: final.updatedAt,
			...(debug
				? { rawCount: (norm.reviews || []).length, v1ErrorBody }
				: null),
		})
	} catch (e) {
		console.error('GET /api/google-reviews failed:', e)
		return NextResponse.json({ ok: false, error: 'internal' }, { status: 500 })
	}
}
