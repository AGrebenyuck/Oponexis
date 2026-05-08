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

function normalizeOptionalText(value) {
	const trimmed = String(value || '').trim()
	return trimmed ? trimmed : null
}

function normalizeWheelRimSize(value) {
	const raw = String(value || '')
		.trim()
		.toUpperCase()
		.replace(/\s+/g, '')
	if (!raw) return null
	const normalized = raw.startsWith('R') ? raw : `R${raw}`
	return /^R(1[3-9]|2[0-2])$/.test(normalized) ? normalized : null
}

// Ищем только реальный дубль текущей формы.
// ВАЖНО: больше нет fallback "любой последний по leadId/phone",
// потому что он обновлял старые прошлогодние записи вместо создания нового заказа.
async function findExistingWorkOrder({
	leadId,
	phone,
	visitDateObj,
	visitTime,
}) {
	if (!visitDateObj || !visitTime) return null

	if (leadId) {
		const byLeadAndSlot = await db.workOrder.findFirst({
			where: { leadId, visitDate: visitDateObj, visitTime },
			orderBy: { id: 'desc' },
		})
		if (byLeadAndSlot) return byLeadAndSlot
	}

	if (phone) {
		const byPhoneAndSlot = await db.workOrder.findFirst({
			where: { phone, visitDate: visitDateObj, visitTime },
			orderBy: { id: 'desc' },
		})
		if (byPhoneAndSlot) return byPhoneAndSlot
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
			visitDate,
			visitTime,
			wheelRimSize,
			tireSize,
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

		const normalizedWheelRimSize = normalizeWheelRimSize(wheelRimSize)
		if (!normalizedWheelRimSize) {
			return NextResponse.json(
				{ ok: false, error: 'Prosimy wybrać poprawny rozmiar felgi.' },
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
			regNumber: normalizeOptionalText(regNumber),
			color: normalizeOptionalText(color),
			carModel: normalizeOptionalText(carModel),
			address: normalizeOptionalText(address),
			lat: finalLat,
			lng: finalLng,
			notes: normalizeOptionalText(notes),
			visitDate: visitDateObj,
			visitTime: visitTime || null,
			wheelRimSize: normalizedWheelRimSize,
			tireSize: normalizeOptionalText(tireSize),
			wantsInvoice: !!wantsInvoice,
			invoiceNip: wantsInvoice ? normalizeOptionalText(invoiceNip) : null,
			invoiceEmail: wantsInvoice ? normalizeOptionalText(invoiceEmail) : null,
		}

		let workOrder
		if (existingOrder) {
			workOrder = await db.workOrder.update({
				where: { id: existingOrder.id },
				data,
			})
		} else {
			workOrder = await db.workOrder.create({ data })
		}

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

		try {
			await updateScheduleMessage()
		} catch (e) {
			console.error('[POST /api/order/client] updateScheduleMessage failed:', e)
		}

		return NextResponse.json({
			ok: true,
			mode: existingOrder ? 'updated' : 'created',
			order: workOrder,
		})
	} catch (e) {
		console.error('POST /api/order/client failed:', e)
		return NextResponse.json(
			{ ok: false, error: 'Błąd serwera' },
			{ status: 500 }
		)
	}
}
