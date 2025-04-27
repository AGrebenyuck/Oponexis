import { db } from '@/lib/prisma'

export async function POST(req) {
	try {
		const { created, updated, deleted } = await req.json()

		console.log('Создано:', created)
		console.log('Обновлено:', updated)
		console.log('Удалено:', deleted)

		// 1. Создание новых услуг
		if (created?.length > 0) {
			await Promise.all(
				created.map(service =>
					db.service.create({
						data: {
							name: service.name,
							price: parseFloat(service.price), // ✅ парсим число
							duration: parseInt(service.duration, 10), // ✅ парсим число
							originalPrice:
								service.originalPrice !== null
									? parseFloat(service.originalPrice)
									: null,
							additionalServices: {
								create:
									service.additionalServices?.map(sub => ({
										id: sub.id,
										name: sub.name,
										price: parseFloat(sub.price), // ✅ парсим число
									})) || [],
							},
						},
					})
				)
			)
		}

		// 2. Обновление существующих услуг
		if (updated?.length > 0) {
			await Promise.all(
				updated.map(service =>
					db.service.update({
						where: { id: service.id },
						data: {
							name: service.name,
							price: parseFloat(service.price), // ✅ парсим число
							duration: parseInt(service.duration, 10), // ✅ парсим число
							originalPrice:
								service.originalPrice !== null
									? parseFloat(service.originalPrice)
									: null,
							additionalServices: {
								deleteMany: {}, // ❗️удаляем старые подуслуги
								create:
									service.additionalServices?.map(sub => ({
										name: sub.name,
										price: parseFloat(sub.price), // ✅ парсим число
									})) || [],
							},
						},
					})
				)
			)
		}

		// 3. Удаление услуг
		if (deleted?.length > 0) {
			await Promise.all(
				deleted.map(service =>
					db.service.delete({
						where: { id: service.id },
					})
				)
			)
		}

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
			},
		})
	} catch (error) {
		console.error('❌ Ошибка сохранения услуг:', error)
		return new Response(
			JSON.stringify({ success: false, error: error.message }),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
				},
			}
		)
	}
}
