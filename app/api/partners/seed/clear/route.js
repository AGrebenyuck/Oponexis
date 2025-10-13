import { db } from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function POST(req) {
	try {
		const url = new URL(req.url)
		const code = url.searchParams.get('code') || 'demo'
		const drop = url.searchParams.get('dropPartner') === '1'

		await db.referralHit.deleteMany({ where: { partnerCode: code } })
		await db.callIntent.deleteMany({ where: { partnerCode: code } })
		await db.lead.deleteMany({ where: { partnerCode: code } })
		await db.reservation.deleteMany({ where: { partnerCode: code } })

		if (drop) {
			await db.partner.deleteMany({ where: { code } })
		}

		return Response.json({ ok: true })
	} catch (e) {
		console.error('seed clear failed:', e)
		return Response.json({ ok: false, error: 'internal' }, { status: 500 })
	}
}
