import { updateZadarmaDeal, updateZadarmaTask } from '@/actions/zadarma'
import { db } from '@/lib/prisma'

export async function POST(req) {
	try {
		const data = await req.json()

		const updatedReservation = await db.$transaction(async prisma => {
			// Обновляем резервацию
			const reservation = await prisma.reservation.update({
				where: { id: data.id },
				data: {
					serviceName: data.service,
					address: data.address,
					contactInfo: data.contactInfo,
					startTime: new Date(`${data.date}T${data.time}:00`),
					endTime: new Date(`${data.date}T${data.timeEnd}:00`),
					serviceNameIds: data.serviceNameIds ?? [],
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

		const NeedToCall = data.isAdditionalService ? ' | Zadzwoń' : ''

		const deltaDescription = {
			ops: [
				{
					attributes: {
						bold: true,
					},
					insert: `Rezerwacja usługi:`,
				},
				{
					insert: `${data.serviceName.join(', ')}\n`,
				},
				{
					attributes: {
						bold: true,
					},
					insert: `Kontakt:`,
				},
				{
					insert: `${data.contactInfo}\n`,
				},
				{
					attributes: {
						bold: true,
					},
					insert: `Adres:`,
				},
				{ insert: `${data.address}\n` },
				{
					attributes: {
						bold: true,
					},
					insert: `Dodatkowa Informacja:`,
				},
				{ insert: `${data.additionalInfo || data.comment}` },
				data.isAdditionalService
					? {
							insert: '\nZadzwoń po dodatkowe usługi\n',
					  }
					: null,
				data.vin ? { insert: `VIN: ${data.vin}\n` } : null,
			].filter(Boolean),
		}
		const dataTask = {
			title: `${data.service} | dealId:${data.zadarmaDealId} ${NeedToCall}`,
			start: data.startTime,
			end: data.endTime,
			description: JSON.stringify(deltaDescription),
		}
		const dataDeal = {
			title: data.service + ' ' + data.date + ' ' + data.time,
			budget: data.price.discountedTotal,
		}

		await updateZadarmaDeal(data.zadarmaDealId, dataDeal)
		await updateZadarmaTask(data.zadarmaTaskId, dataTask)

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
