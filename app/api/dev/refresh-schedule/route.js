// app/api/dev/refresh-schedule/route.js
import { updateScheduleMessage } from '@/lib/telegramBot'
import { NextResponse } from 'next/server'

export async function GET() {
	try {
		await updateScheduleMessage()
		return NextResponse.json({ ok: true })
	} catch (e) {
		console.error('GET /api/dev/refresh-schedule failed:', e)
		return NextResponse.json(
			{ ok: false, error: 'Server error' },
			{ status: 500 }
		)
	}
}
