import { db } from '@/lib/prisma'
import webpush from 'web-push'

const VAPID_DETAILS = {
	subject: process.env.VAPID_SUBJECT,
	publicKey: process.env.VAPID_PUBLIC_KEY,
	privateKey: process.env.VAPID_PRIVATE_KEY,
}

webpush.setVapidDetails(
	VAPID_DETAILS.subject,
	VAPID_DETAILS.publicKey,
	VAPID_DETAILS.privateKey
)

export async function sendPushNotificationToAll({ title, body }) {
	const subscriptions = await db.pushSubscription.findMany()

	const payload = JSON.stringify({ title, body })

	for (const sub of subscriptions) {
		const pushSub = {
			endpoint: sub.endpoint,
			keys: {
				p256dh: sub.p256dh,
				auth: sub.auth,
			},
		}

		try {
			const res = await webpush.sendNotification(pushSub, payload)

			console.log(res)
		} catch (error) {
			if (error.statusCode === 410 || error.statusCode === 404) {
				console.warn('❌ Удаляем недействительную подписку')
				await db.pushSubscription.delete({ where: { endpoint: sub.endpoint } })
			} else {
				console.error('❌ Ошибка отправки уведомления:', error)
			}
		}
	}
}
