// app/api/order/client/route.js
import { db } from '@/lib/prisma'
import {
	// 👇 добавляем два хелпера из telegramBot.js (они были в шаге 3.4)
	markSmsFormCompletedByLead,
	markSmsFormCompletedByPhone,
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

		// 🔥 конвертим строку даты в UTC Date
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

		// 👇 ШАГ 6: отмечаем "форма пришла" в SmsFormLog
		try {
			if (workOrder.leadId) {
				// если есть leadId — матчим по нему (точнее)
				await markSmsFormCompletedByLead(workOrder.leadId)
			} else if (workOrder.phone) {
				// если лида нет (звонок/ручной кейс) — матчим по телефону
				await markSmsFormCompletedByPhone(workOrder.phone, {
					visitDate,
					visitTime,
				})
			}
		} catch (e) {
			// не ломаем создание заказа, только логируем
			console.error('[POST /api/order/client] markSmsFormCompleted failed:', e)
		}

		// отправляем карточку в рабочий чат
		await sendWorkOrderToTelegram(workOrder, {
			visitDate: visitDate || null, // для текста в карточке — как строку
			visitTime: visitTime || null,
		})

		// обновляем закреплённый график визитów
		await updateScheduleMessage()

		return NextResponse.json({ ok: true, order: workOrder })
	} catch (e) {
		console.error('POST /api/order/client failed:', e)
		return NextResponse.json(
			{ ok: false, error: 'Błąd serwera' },
			{ status: 500 }
		)
	}
}
