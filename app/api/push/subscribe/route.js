import { db } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req) {
	const { endpoint, keys } = await req.json()

	if (!endpoint || !keys?.p256dh || !keys?.auth) {
		return NextResponse.json(
			{ success: false, error: 'Invalid subscription' },
			{ status: 400 }
		)
	}

	try {
		await db.pushSubscription.upsert({
			where: { endpoint },
			update: { p256dh: keys.p256dh, auth: keys.auth },
			create: {
				endpoint,
				p256dh: keys.p256dh,
				auth: keys.auth,
			},
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Ошибка сохранения подписки:', error)
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		)
	}
}
