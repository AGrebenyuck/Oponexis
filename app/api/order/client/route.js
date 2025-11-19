// app/api/order/client/route.js
import { db } from '@/lib/prisma'
import {
	sendWorkOrderToTelegram,
	updateScheduleMessage,
} from '@/lib/telegramBot'
import { NextResponse } from 'next/server'

// YYYY-MM-DD -> Date (UTC 00:00)
function parseVisitDate(str) {
	if (!str) return null
	const [y, m, d] = String(str).split('-').map(Number)
	if (!y || !m || !d) return null
	return new Date(Date.UTC(y, m - 1, d, 0, 0, 0))
}

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
			visitDate, // "YYYY-MM-DD" из SMS-редиректа
			visitTime, // "HH:MM"
		} = body || {}

		if (!name?.trim() || !phone?.trim()) {
			return NextResponse.json(
				{ ok: false, error: 'Brak wymaganych danych (imię, telefon)' },
				{ status: 400 }
			)
		}

		const finalLat = typeof lat === 'number' ? lat : null
		const finalLng = typeof lng === 'number' ? lng : null

		// 🔥 фикс: конвертим строку в UTC дату
		const visitDateObj =
			typeof visitDate === 'string' && visitDate
				? parseVisitDate(visitDate)
				: null

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
				visitDate: visitDateObj,
				visitTime: visitTime || null,
			},
		})

		// отправляем карточку в рабочий чат
		await sendWorkOrderToTelegram(workOrder, {
			visitDate: visitDate || null, // для текста в карточке оставляем строку
			visitTime: visitTime || null,
		})

		// обновляем закреплённый график
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
