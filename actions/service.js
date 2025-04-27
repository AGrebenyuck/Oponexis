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

export async function updateServices(data) {
	const response = await fetch(`${process.env.URL}/api/services`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			created: data.created,
			updated: data.updated,
			deleted: data.deleted,
		}),
	})

	if (!response.ok) {
		throw new Error('Ошибка обновления услуг')
	}

	return response.json()
}
