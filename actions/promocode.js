'use server'

import { db } from '@/lib/prisma'

export async function getPromoCodes() {
	try {
		const promocodes = await db.promoCode.findMany({
			select: {
				id: true,
				code: true,
				type: true,
				value: true,
				uses: true,
				createdAt: true,
			},
		})

		return { promocodes }
	} catch (error) {
		console.error('❌ Ошибка при получении promocodes:', error.message)
		return {}
	}
}

export async function updatePromoCodes(data) {
	const response = await fetch(`${process.env.URL}/api/promocodes`, {
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
		throw new Error('Ошибка обновления промокодов')
	}

	return response.json()
}
