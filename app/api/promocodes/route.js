import { db } from '@/lib/prisma'

export async function POST(req) {
	try {
		const { created, updated, deleted } = await req.json()

		console.log('Создано промокодов:', created)
		console.log('Обновлено промокодов:', updated)
		console.log('Удалено промокодов:', deleted)

		// Создание новых промокодов
		if (created?.length > 0) {
			await Promise.all(
				created.map(promo =>
					db.promoCode.create({
						data: {
							code: promo.code,
							type: promo.type,
							value: parseFloat(promo.value),
							uses: promo.uses || 0,
						},
					})
				)
			)
		}

		// Обновление промокодов
		if (updated?.length > 0) {
			await Promise.all(
				updated.map(promo =>
					db.promoCode.update({
						where: { id: promo.id },
						data: {
							code: promo.code,
							type: promo.type,
							value: parseFloat(promo.value),
							uses: promo.usageCount || 0,
						},
					})
				)
			)
		}

		// Удаление промокодов
		if (deleted?.length > 0) {
			await Promise.all(
				deleted.map(promo =>
					db.promoCode.delete({
						where: { id: promo.id },
					})
				)
			)
		}

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		})
	} catch (error) {
		console.error('❌ Ошибка сохранения промокодов:', error)
		return new Response(
			JSON.stringify({ success: false, error: error.message }),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		)
	}
}
