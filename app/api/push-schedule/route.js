import { db } from '@/lib/prisma'
import { sendPushNotificationToAll } from '@/lib/push/sendPushNotificationToAll'

import { DateTime } from 'luxon'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
	try {
		const now = DateTime.now().setZone('Europe/Warsaw')
		const twoHoursLater = now.plus({ hours: 2 })

		// Получаем все бронирования, начинающиеся через 2 часа
		const upcomingReservations = await db.reservation.findMany({
			where: {
				startTime: {
					gte: now.toJSDate(),
					lte: twoHoursLater.toJSDate(),
				},
			},
		})

		for (const reservation of upcomingReservations) {
			const notificationExists = await db.sentNotification.findFirst({
				where: {
					date: reservation.startTime,
				},
			})

			if (!notificationExists) {
				await sendPushNotificationToAll({
					title: '⏰ Напоминание о предстоящей услуге',
					body: `Услуга начнётся в ${DateTime.fromJSDate(
						reservation.startTime
					).toFormat('HH:mm')}`,
				})

				await db.sentNotification.create({
					data: { date: reservation.startTime },
				})
			}
		}

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('❌ push-schedule error:', error)
		return NextResponse.json({ success: false, error: error.message })
	}
}
