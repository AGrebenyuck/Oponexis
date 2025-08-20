import { db } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req) {
	const { endpoint } = await req.json()

	if (!endpoint) {
		return NextResponse.json(
			{ success: false, error: 'Missing endpoint' },
			{ status: 400 }
		)
	}

	try {
		await db.pushSubscription.delete({ where: { endpoint } })
		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Ошибка удаления подписки:', error)
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		)
	}
}
