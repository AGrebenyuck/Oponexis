'use server'

import { db } from '@/lib/prisma'

export async function getPromoCodes() {
	try {
		const promocodes = await db.promoCode.findMany({
			select: { id: true, code: true, type: true, value: true },
		})

		return { promocodes }
	} catch (error) {
		console.error('❌ Ошибка при получении promocodes:', error.message)
		return {}
	}
}
