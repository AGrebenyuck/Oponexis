import { db } from '@/lib/prisma'

export async function POST(req) {
	try {
		const data = await req.json()

		// Обновляем резервацию в БД
		const updatedReservation = await db.reservation.update({
			where: { id: data.id },
			data: {
				serviceName: data.serviceName,
				address: data.address,
				contactInfo: data.contactInfo,
				startTime: new Date(data.date + 'T' + data.time + ':00'),
				endTime: new Date(data.date + 'T' + data.timeEnd + ':00'),
			},
			include: {
				services: true,
			},
		})

		// Обновляем услуги (удаляем старые и добавляем новые)
		await db.serviceReservation.deleteMany({
			where: { reservationId: data.id },
		})

		const newServices = data.services.map(serviceId => ({
			reservationId: data.id,
			serviceId,
		}))

		await db.serviceReservation.createMany({
			data: newServices,
		})

		return new Response(JSON.stringify({ success: true, updatedReservation }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		})
	} catch (error) {
		console.error('Ошибка обновления бронирования:', error)
		return new Response(
			JSON.stringify({ success: false, error: error.message }),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		)
	}
}
