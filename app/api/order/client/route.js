// app/api/order/client/route.js
import { db } from '@/lib/prisma'
import {
	markSmsFormCompletedByLead,
	markSmsFormCompletedByPhone,
	sendWorkOrderToTelegram,
	updateScheduleMessage,
	updateWorkOrderMessage,
} from '@/lib/telegramBot'
import { NextResponse } from 'next/server'

// YYYY-MM-DD -> Date (UTC 00:00)
function parseVisitDate(str) {
	if (!str) return null
	const [y, m, d] = String(str).split('-').map(Number)
	if (!y || !m || !d) return null
	return new Date(Date.UTC(y, m - 1, d, 0, 0, 0))
}

// лёгкая нормализация телефона
function normalizePhone(raw) {
	if (!raw) return null
	const trimmed = String(raw).trim()
	const hasPlus = trimmed.startsWith('+')
	const digits = trimmed.replace(/[^\d]/g, '')
	if (!digits) return null

	if (hasPlus) return '+' + digits
	if (digits.length === 9) return '+48' + digits
	return '+' + digits
}

// усиленный поиск существующей заявки, чтобы не плодить дубликаты
async function findExistingWorkOrder({
	leadId,
	phone,
	visitDateObj,
	visitTime,
}) {
	let existing = null

	// 1) leadId + дата + время
	if (leadId && visitDateObj) {
		existing = await db.workOrder.findFirst({
			where: {
				leadId,
				visitDate: visitDateObj,
				visitTime: visitTime || null,
			},
		})
		if (existing) return existing
	}

	// 2) leadId + дата (без времени)
	if (!existing && leadId && visitDateObj) {
		existing = await db.workOrder.findFirst({
			where: { leadId, visitDate: visitDateObj },
			orderBy: { id: 'desc' },
		})
		if (existing) return existing
	}

	// 3) телефон + дата + время
	if (!existing && phone && visitDateObj) {
		existing = await db.workOrder.findFirst({
			where: {
				leadId: null,
				phone,
				visitDate: visitDateObj,
				visitTime: visitTime || null,
			},
		})
		if (existing) return existing
	}

	// 4) телефон + дата (без времени)
	if (!existing && phone && visitDateObj) {
		existing = await db.workOrder.findFirst({
			where: {
				leadId: null,
				phone,
				visitDate: visitDateObj,
			},
			orderBy: { id: 'desc' },
		})
		if (existing) return existing
	}

	// 5) fallback: любой последний по leadId
	if (!existing && leadId) {
		existing = await db.workOrder.findFirst({
			where: { leadId },
			orderBy: { id: 'desc' },
		})
		if (existing) return existing
	}

	// 6) fallback: любой последний по телефону
	if (!existing && phone) {
		existing = await db.workOrder.findFirst({
			where: { phone },
			orderBy: { id: 'desc' },
		})
		if (existing) return existing
	}

	return null
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
			visitDate, // "YYYY-MM-DD"
			visitTime, // "HH:MM"

			// faktura
			wantsInvoice,
			invoiceNip,
			invoiceEmail,
		} = body || {}

		if (!name?.trim() || !phone?.trim()) {
			return NextResponse.json(
				{ ok: false, error: 'Brak wymaganych danych (imię, telefon)' },
				{ status: 400 }
			)
		}

		const normalizedPhone = normalizePhone(phone) || phone.trim()
		const finalLat = typeof lat === 'number' ? lat : null
		const finalLng = typeof lng === 'number' ? lng : null

		const visitDateObj =
			typeof visitDate === 'string' && visitDate
				? parseVisitDate(visitDate)
				: null

		// ищем дубликат/существующую заявку
		const existingOrder = await findExistingWorkOrder({
			leadId: leadId || null,
			phone: normalizedPhone,
			visitDateObj,
			visitTime: visitTime || null,
		})

		const data = {
			leadId: leadId || null,
			name: name.trim(),
			phone: normalizedPhone,
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

			// faktura
			wantsInvoice: !!wantsInvoice,
			invoiceNip: wantsInvoice ? invoiceNip || null : null,
			invoiceEmail: wantsInvoice ? invoiceEmail || null : null,
		}

		let workOrder

		if (existingOrder) {
			// 🔄 обновляем существующую запись
			workOrder = await db.workOrder.update({
				where: { id: existingOrder.id },
				data,
			})
		} else {
			// 🆕 создаём новую
			workOrder = await db.workOrder.create({ data })
		}

		// отмечаем SmsFormLog
		try {
			if (workOrder.leadId) {
				await markSmsFormCompletedByLead(workOrder.leadId)
			} else if (workOrder.phone) {
				await markSmsFormCompletedByPhone(workOrder.phone, {
					visitDate,
					visitTime,
				})
			}
		} catch (e) {
			console.error('[POST /api/order/client] markSmsFormCompleted failed:', e)
		}

		// 🔔 Telegram: либо обновляем существующую карточку, либо создаём новую
		try {
			if (existingOrder && existingOrder.telegramMessageId) {
				await updateWorkOrderMessage(workOrder)
			} else {
				await sendWorkOrderToTelegram(workOrder, {
					visitDate: visitDate || null,
					visitTime: visitTime || null,
				})
			}
		} catch (e) {
			console.error(
				'[POST /api/order/client] Telegram card send/update failed:',
				e
			)
		}

		// 📅 обновляем закреплённый график
		try {
			await updateScheduleMessage()
		} catch (e) {
			console.error('[POST /api/order/client] updateScheduleMessage failed:', e)
		}

		return NextResponse.json({ ok: true, order: workOrder })
	} catch (e) {
		console.error('POST /api/order/client failed:', e)
		return NextResponse.json(
			{ ok: false, error: 'Błąd serwera' },
			{ status: 500 }
		)
	}
}
