// app/api/partners/[code]/stats/route.js
import { db } from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function GET(req, context) {
	const params = await context.params
	const code = params.code

	const url = new URL(req.url)
	const months = Number(url.searchParams.get('months') || 12)
	const days = Number(url.searchParams.get('days') || 30)

	const partner = await db.partner.findUnique({ where: { code } })
	if (!partner) return Response.json({ ok: false }, { status: 404 })

	// totals
	const hits = await db.referralHit.findMany({ where: { partnerCode: code } })
	const uniqueVisitors = new Set(hits.map(h => h.visitorId)).size

	const reservations = await db.reservation.findMany({
		where: { partnerCode: code },
		select: { partnerCommissionAmount: true },
	})
	const orders = reservations.length
	const commissionTotal = reservations.reduce(
		(s, r) => s + (r.partnerCommissionAmount || 0),
		0
	)
	const callsTotal = await db.callIntent.count({ where: { partnerCode: code } })

	const cr = uniqueVisitors ? orders / uniqueVisitors : 0

	// daily — собираем визиты (по h.day) и звонки (по createdAt), потом берём последние N дней
	const byDayVisits = new Map()
	for (const h of hits) {
		byDayVisits.set(h.day, (byDayVisits.get(h.day) || 0) + 1)
	}

	const callsAll = await db.callIntent.findMany({
		where: { partnerCode: code },
		select: { createdAt: true },
		orderBy: { createdAt: 'asc' },
	})
	const byDayCalls = new Map()
	for (const c of callsAll) {
		const d = c.createdAt.toISOString().slice(0, 10)
		byDayCalls.set(d, (byDayCalls.get(d) || 0) + 1)
	}

	const allDays = Array.from(
		new Set([...byDayVisits.keys(), ...byDayCalls.keys()])
	).sort()
	const lastN = days > 0 ? allDays.slice(-days) : allDays
	const daily = lastN.map(date => ({
		date,
		visitors: byDayVisits.get(date) || 0,
		calls: byDayCalls.get(date) || 0,
	}))

	// monthly (окно N месяцев)
	const from = new Date()
	from.setMonth(from.getMonth() - (months - 1))
	from.setDate(1)
	from.setHours(0, 0, 0, 0)

	const callsWindow = await db.callIntent.findMany({
		where: { partnerCode: code, createdAt: { gte: from } },
		select: { createdAt: true },
		orderBy: { createdAt: 'asc' },
	})
	const resWindow = await db.reservation.findMany({
		where: { partnerCode: code, createdAt: { gte: from } },
		select: { createdAt: true, partnerCommissionAmount: true },
		orderBy: { createdAt: 'asc' },
	})

	const ym = d =>
		`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

	const byMonth = new Map()

	// visits: используем h.day (YYYY-MM-DD), фильтруем >= первого месяца окна
	const fromStr = from.toISOString().slice(0, 7) // 'YYYY-MM'
	for (const h of hits) {
		const ymKey = h.day.slice(0, 7)
		if (ymKey >= fromStr) {
			const cur = byMonth.get(ymKey) || {
				visits: 0,
				calls: 0,
				orders: 0,
				commission: 0,
			}
			cur.visits += 1
			byMonth.set(ymKey, cur)
		}
	}

	// calls
	for (const c of callsWindow) {
		const key = ym(c.createdAt)
		const cur = byMonth.get(key) || {
			visits: 0,
			calls: 0,
			orders: 0,
			commission: 0,
		}
		cur.calls += 1
		byMonth.set(key, cur)
	}

	// orders + commission
	for (const r of resWindow) {
		const key = ym(r.createdAt)
		const cur = byMonth.get(key) || {
			visits: 0,
			calls: 0,
			orders: 0,
			commission: 0,
		}
		cur.orders += 1
		cur.commission += r.partnerCommissionAmount || 0
		byMonth.set(key, cur)
	}

	// выстраиваем месяцы слева направо
	const monthly = []
	const cursor = new Date(from)
	const end = new Date()
	end.setDate(1)
	end.setHours(0, 0, 0, 0)
	while (cursor <= end) {
		const key = ym(cursor)
		const e = byMonth.get(key) || {
			visits: 0,
			calls: 0,
			orders: 0,
			commission: 0,
		}
		monthly.push({
			month: key,
			visits: e.visits,
			calls: e.calls,
			orders: e.orders,
			commission: Number(e.commission.toFixed(2)),
		})
		cursor.setMonth(cursor.getMonth() + 1)
	}

	return Response.json({
		ok: true,
		totals: {
			uniqueVisitors,
			orders,
			calls: callsTotal,
			cr,
			commission: Number(commissionTotal.toFixed(2)),
			commissionPct: partner.commissionPct, // 10%
		},
		daily,
		monthly,
	})
}
