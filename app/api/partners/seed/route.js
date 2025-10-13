// app/api/partners/seed/route.js
import { db } from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function POST(req) {
	try {
		// безопасно читаем тело (может быть пустым)
		let body = {}
		try {
			body = await req.json()
		} catch {
			body = {}
		}

		const {
			code = 'inCar',
			name = 'inCar Partner',
			months = 3,
			avgDailyVisits = 15,
			callRate = 0.1,
			leadRate = 0.22,
			orderRate = 0.4,
			commissionPct = 10,
			orderValueMean = 200,
			orderValueSpread = 0.25,
			gapWeights = { 0: 0.5, 1: 0.2, 2: 0.15, 3: 0.1, 4: 0.04, 5: 0.01 },
		} = body

		const partner = await db.partner.upsert({
			where: { code },
			create: { code, name, commissionPct },
			update: { name, commissionPct },
		})

		// единый demo user
		const demoUser = await db.user.upsert({
			where: { email: 'demo@local' },
			create: {
				email: 'demo@local',
				name: 'Demo User',
				phone: '+48111111111',
				role: 'user',
			},
			update: { name: 'Demo User' },
		})

		const today = new Date()
		const start = new Date(today)
		start.setMonth(start.getMonth() - (months - 1))
		start.setDate(1)
		start.setHours(0, 0, 0, 0)

		const ym = d =>
			`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
		const ymd = d => d.toISOString().slice(0, 10)
		const rand = () => Math.random()
		const jitter = (v, spread) =>
			Math.max(50, v * (1 + (rand() * 2 - 1) * spread))

		function pickGap() {
			const entries = Object.entries(gapWeights).map(([k, v]) => [
				Number(k),
				Number(v),
			])
			const total = entries.reduce((s, [, w]) => s + w, 0) || 1
			let roll = Math.random() * total
			for (const [len, w] of entries) {
				if ((roll -= w) <= 0) return len
			}
			return 0
		}

		await db.referralHit.deleteMany({ where: { partnerCode: code } })
		await db.callIntent.deleteMany({ where: { partnerCode: code } })
		await db.lead.deleteMany({ where: { partnerCode: code } })
		await db.reservation.deleteMany({ where: { partnerCode: code } })

		let visitorCounter = 0
		const cursor = new Date(start)

		while (cursor <= today) {
			const gap = pickGap()
			if (gap > 0) {
				cursor.setDate(cursor.getDate() + gap)
				if (cursor > today) break
			}

			const dayStr = ymd(cursor)
			const monthKey = ym(cursor)
			const visits = Math.round(avgDailyVisits * (0.8 + Math.random() * 0.4))
			const visitorIds = Array.from(
				{ length: visits },
				() => `vis-${visitorCounter++}`
			)

			// Referral hits
			const hitTime = new Date(`${dayStr}T12:00:00Z`)
			await db.$transaction(
				visitorIds.map(vid =>
					db.referralHit.upsert({
						where: {
							partnerCode_visitorId_day: {
								partnerCode: code,
								visitorId: vid,
								day: dayStr,
							},
						},
						create: {
							partnerCode: code,
							visitorId: vid,
							day: dayStr,
							createdAt: hitTime,
						},
						update: {},
					})
				)
			)

			// Calls
			const calls = visitorIds.filter(() => Math.random() < callRate)
			await db.$transaction(
				calls.map(() =>
					db.callIntent.create({
						data: {
							partnerCode: code,
							ua: 'Demo UA',
							createdAt: new Date(`${dayStr}T13:00:00Z`),
						},
					})
				)
			)

			// Leads
			const leads = visitorIds.filter(() => Math.random() < leadRate)
			await db.$transaction(
				leads.map((_, i) =>
					db.lead.create({
						data: {
							partnerCode: code,
							name: `Jan Demo ${i + 1}`,
							phone: `+48 123 45 ${String(100 + i).padStart(3, '0')}`,
							serviceId: 'svc-demo',
							serviceName: 'Usługa demo',
							monthKey,
							createdAt: new Date(`${dayStr}T14:00:00Z`),
						},
					})
				)
			)

			// Orders
			const orders = leads.filter(() => Math.random() < orderRate)
			await db.$transaction(
				orders.map(() => {
					const price = jitter(orderValueMean, orderValueSpread)
					const commission = Number(((commissionPct / 100) * price).toFixed(2))
					return db.reservation.create({
						data: {
							userId: demoUser.id,
							address: 'Demo Street 1',
							serviceName: 'Usługa demo',
							contactInfo: 'demo@local',
							startTime: new Date(`${dayStr}T16:00:00Z`),
							endTime: new Date(`${dayStr}T17:00:00Z`),
							price,
							status: 'confirmed',
							serviceNameIds: ['svc-demo'],
							partnerCode: code,
							partnerCommissionAmount: commission,
							createdAt: new Date(`${dayStr}T15:00:00Z`),
						},
					})
				})
			)

			cursor.setDate(cursor.getDate() + 1)
		}

		return Response.json({
			ok: true,
			partner: { code: partner.code, commissionPct: partner.commissionPct },
		})
	} catch (e) {
		console.error('seed failed:', e)
		return Response.json(
			{ ok: false, error: String(e.message) },
			{ status: 500 }
		)
	}
}
