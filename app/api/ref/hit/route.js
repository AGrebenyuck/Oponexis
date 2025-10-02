import { db } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req) {
	const { code } = await req.json().catch(() => ({}))
	const store = await cookies()
	const vid = store.get('opx_vid')?.value
	const codeFromCookie = store.get('opx_ref_code')?.value
	const partnerCode = code || codeFromCookie

	if (!partnerCode || !vid)
		return NextResponse.json({ ok: false }, { status: 400 })

	const partner = await db.partner.findUnique({
		where: { code: partnerCode },
	})
	if (!partner)
		return NextResponse.json(
			{ ok: false, reason: 'no-partner' },
			{ status: 404 }
		)

	const day = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

	try {
		await db.referralHit.create({
			data: { partnerCode: partner.code, visitorId: vid, day },
		})
	} catch {
		// уже был хит сегодня — игнорим
	}

	return NextResponse.json({ ok: true })
}
