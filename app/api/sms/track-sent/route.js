// app/api/sms/track-sent/route.js
import { logSmsFormSent } from '@/lib/telegramBot'
import { NextResponse } from 'next/server'

export async function POST(req) {
	try {
		const body = await req.json()
		const {
			phone,
			name,
			service,
			leadId,
			source,
			visitDate, // "YYYY-MM-DD"
			visitTime, // "HH:MM"
		} = body || {}

		if (!phone) {
			return NextResponse.json(
				{ ok: false, error: 'Missing phone' },
				{ status: 400 }
			)
		}

		await logSmsFormSent({
			phone,
			name,
			service,
			leadId,
			source: source || (leadId ? 'lead' : 'manual'),
			visitDate,
			visitTime,
		})

		return NextResponse.json({ ok: true })
	} catch (e) {
		console.error('/api/sms/track-sent failed:', e)
		return NextResponse.json(
			{ ok: false, error: 'Server error' },
			{ status: 500 }
		)
	}
}
