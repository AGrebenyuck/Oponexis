import { getBooking } from '@/actions/booking'
import { db } from '@/lib/prisma'
import { sendPushNotificationToAll } from '@/lib/push/sendPushNotificationToAll'

import { DateTime } from 'luxon'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
	try {
		const today = DateTime.now().setZone('Europe/Warsaw').startOf('day')

		const alreadySent = await db.sentNotification.findUnique({
			where: { date: today.toJSDate() },
		})

		if (alreadySent) {
			return NextResponse.json({ success: false, message: 'Already sent' })
		}

		const bookingsByDate = await getBooking()
		const todayKey = today.toFormat('yyyy-MM-dd')
		const todayBookings = bookingsByDate[todayKey] || []

		await sendPushNotificationToAll({
			title: '📅 Zadania na dziś',
			body: `Masz ${todayBookings.length} zadań do wykonania.`,
		})

		await db.sentNotification.create({
			data: { date: today.toJSDate() },
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('❌ push-daily-summary error:', error)
		return NextResponse.json({ success: false, error: error.message })
	}
}
