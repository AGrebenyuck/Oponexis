import { sendPushNotificationToAll } from '@/lib/push/sendPushNotificationToAll'
import { NextResponse } from 'next/server'

export async function GET() {
	await sendPushNotificationToAll({
		title: '🔔 Test notification',
		body: 'To tylko test!',
	})
	return NextResponse.json({ success: true })
}
