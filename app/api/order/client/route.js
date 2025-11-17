import { db } from '@/lib/prisma'
import { sendWorkOrderToTelegram } from '@/lib/telegramBot'
import { NextResponse } from 'next/server'

export async function POST(req) {
	try {
		const body = await req.json()

		const {
			leadId,
			name,
			phone,
			service,
			regNumber,
			color,
			carModel,
			address,
			lat,
			lng,
			notes,
			visitDate,
			visitTime,
		} = body || {}

		if (!name?.trim() || !phone?.trim()) {
			return NextResponse.json(
				{ ok: false, error: 'Brak wymaganych danych (imię, telefon)' },
				{ status: 400 }
			)
		}

		// 👉 Вариант A:
		// - если пользователь выбрал на карте — lat/lng уже пришли с клиента
		// - если вводил вручную — lat/lng могут быть null, и мы НЕ геокодим здесь
		const finalLat = typeof lat === 'number' ? lat : null
		const finalLng = typeof lng === 'number' ? lng : null

		const workOrder = await db.workOrder.create({
			data: {
				leadId: leadId ? leadId : null,
				name: name.trim(),
				phone: phone.trim(),
				service: service || null,
				regNumber: regNumber || null,
				color: color || null,
				carModel: carModel || null,
				address: address || null,
				lat: finalLat,
				lng: finalLng,
				notes: notes || null,
			},
		})

		// ➕ пробрасываем visitDate/visitTime отдельно — в БД не пишем
		await sendWorkOrderToTelegram(workOrder, {
			visitDate: visitDate || null,
			visitTime: visitTime || null,
		})

		return NextResponse.json({ ok: true })
	} catch (e) {
		console.error('POST /api/order/client failed:', e)
		return NextResponse.json(
			{ ok: false, error: 'Błąd serwera' },
			{ status: 500 }
		)
	}
}
