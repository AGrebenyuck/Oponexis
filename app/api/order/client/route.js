// app/api/order/client/route.js
import { db } from '@/lib/prisma'
import {
	sendWorkOrderToTelegram,
	updateScheduleMessage,
} from '@/lib/telegramBot'
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

		// координаты, как было
		const finalLat = typeof lat === 'number' ? lat : null
		const finalLng = typeof lng === 'number' ? lng : null

		// 🔥 нормализуем дату визита (если пришла) — храним как Date с 00:00
		let visitDateValue = null
		if (visitDate) {
			// visitDate ожидаем в формате "YYYY-MM-DD"
			const [y, m, d] = String(visitDate).split('-').map(Number)
			if (y && m && d) {
				// создаём дату в локальном времени (можно и UTC, если хочешь строго)
				visitDateValue = new Date(y, m - 1, d)
			}
		}

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
				visitDate: visitDateValue,
				visitTime: visitTime || null,
			},
		})

		// отправляем обычную карточку (как было)
		await sendWorkOrderToTelegram(workOrder, {
			visitDate: visitDate || null,
			visitTime: visitTime || null,
		})

		// 🔥 обновляем закреплённое сообщение-расписание
		await updateScheduleMessage()

		return NextResponse.json({ ok: true })
	} catch (e) {
		console.error('POST /api/order/client failed:', e)
		return NextResponse.json(
			{ ok: false, error: 'Błąd serwera' },
			{ status: 500 }
		)
	}
}
