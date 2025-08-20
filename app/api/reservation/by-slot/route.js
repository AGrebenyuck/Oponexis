// app/api/reservation/by-slot/route.js
import { db } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { DateTime } from 'luxon'

export const dynamic = 'force-dynamic'

export async function GET(req) {
	try {
		const { searchParams } = new URL(req.url)
		const start = searchParams.get('start')
		const end = searchParams.get('end')

		if (!start || !end) {
			return NextResponse.json(
				{ success: false, error: 'Missing start or end parameters' },
				{ status: 400 }
			)
		}

		const startISO = DateTime.fromISO(start).toUTC().toJSDate()
		const endISO = DateTime.fromISO(end).toUTC().toJSDate()

		const reservation = await db.reservation.findFirst({
			where: {
				startTime: startISO,
				endTime: endISO,
			},
			include: {
				user: true,
				services: {
					include: {
						service: true,
					},
				},
			},
		})

		if (!reservation) {
			return NextResponse.json(
				{ success: false, error: 'Reservation not found' },
				{ status: 404 }
			)
		}

		return NextResponse.json({ success: true, data: reservation })
	} catch (error) {
		console.error('❌ Ошибка получения резервации по времени:', error)
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		)
	}
}
