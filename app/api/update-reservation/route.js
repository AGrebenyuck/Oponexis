import { db } from '@/lib/prisma'

export async function POST(req) {
	try {
		const data = await req.json()

		const updatedReservation = await db.$transaction(async prisma => {
			// Обновляем резервацию
			const reservation = await prisma.reservation.update({
				where: { id: data.id },
				data: {
					serviceName: data.serviceName,
					address: data.address,
					contactInfo: data.contactInfo,
					startTime: new Date(`${data.date}T${data.time}:00`),
					endTime: new Date(`${data.date}T${data.timeEnd}:00`),
				},
			})

			// Удаляем старые услуги
			await prisma.serviceReservation.deleteMany({
				where: { reservationId: data.id },
			})

			// Добавляем новые услуги
			const newServices = data.services.map(serviceId => ({
				reservationId: data.id,
				serviceId,
			}))

			await prisma.serviceReservation.createMany({ data: newServices })

			// Загружаем обновленные данные бронирования (включая новые услуги)
			return prisma.reservation.findUnique({
				where: { id: data.id },
				include: { services: true },
			})
		})

		return new Response(JSON.stringify({ success: true, updatedReservation }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		})
	} catch (error) {
		console.error('Ошибка обновления бронирования api:', error)
		return new Response(
			JSON.stringify({ success: false, error: error.message }),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		)
	}
}
