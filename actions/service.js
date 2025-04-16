'use server'

import { db } from '@/lib/prisma'

export async function getServices() {
	try {
		const prices = await db.service.findMany({
			select: {
				id: true,
				name: true,
				price: true,
				originalPrice: true,
				duration: true,
				additionalServices: true,
			},
		})

		return { success: true, prices }
	} catch (error) {
		console.error('❌ Ошибка при получении цены:', error.message)
		return {}
	}
}
