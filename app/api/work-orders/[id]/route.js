// app/api/work-orders/[id]/route.js
import { db } from '@/lib/prisma'
import {
	updateScheduleMessage,
	updateWorkOrderMessage,
} from '@/lib/telegramBot'
import { DateTime } from 'luxon'
import { NextResponse } from 'next/server'

const ZONE = 'Europe/Warsaw'

// YYYY-MM-DD → Date (UTC) через локальную полночь в Польше
function parseVisitDate(str) {
	if (!str) return null
	const dt = DateTime.fromISO(String(str), { zone: ZONE }).startOf('day')
	if (!dt.isValid) return null
	// Prisma ожидает JS Date → храним в UTC, но дата считается по Польше
	return dt.toJSDate()
}

// Универсальный поиск по id: пробуем как Int и как String
async function findWorkOrderById(rawId) {
	// 1) пробуем как число (под модель с Int @id)
	const asNumber = Number(rawId)
	if (!Number.isNaN(asNumber)) {
		try {
			const byNumber = await db.workOrder.findUnique({
				where: { id: asNumber },
			})
			if (byNumber) return byNumber
		} catch (e) {
			console.error('[work-orders API] findUnique by numeric id failed:', e)
		}
	}

	// 2) пробуем как строку (под модель с String @id)
	try {
		const byString = await db.workOrder.findUnique({
			where: { id: String(rawId) },
		})
		return byString
	} catch (e) {
		console.error('[work-orders API] findUnique by string id failed:', e)
		return null
	}
}

// =====================================
// GET /api/work-orders/:id
// =====================================
export async function GET(req, ctx) {
	try {
		const params = await ctx.params
		const rawId = params?.id

		if (!rawId) {
			return NextResponse.json(
				{ ok: false, error: 'Missing id param' },
				{ status: 400 }
			)
		}

		const order = await findWorkOrderById(rawId)

		if (!order) {
			return NextResponse.json(
				{ ok: false, error: 'Work order not found' },
				{ status: 404 }
			)
		}

		return NextResponse.json({ ok: true, order })
	} catch (e) {
		console.error(
			'GET /api/work-orders/[id] failed (outer catch):',
			e ?? '(null)'
		)

		// ВАЖНО: всегда отдаём JSON, чтобы фронт не ловил HTML
		return NextResponse.json(
			{ ok: false, error: 'Server error' },
			{ status: 500 }
		)
	}
}

// =====================================
// PUT /api/work-orders/:id
// =====================================
export async function PUT(req, ctx) {
	try {
		const params = await ctx.params
		const rawId = params?.id

		if (!rawId) {
			return NextResponse.json(
				{ ok: false, error: 'Missing id param' },
				{ status: 400 }
			)
		}

		const incoming = await req.json()

		const existing = await findWorkOrderById(rawId)

		if (!existing) {
			return NextResponse.json(
				{ ok: false, error: 'Work order not found' },
				{ status: 404 }
			)
		}

		const updated = await db.workOrder.update({
			where: { id: existing.id }, // тип id берём из БД
			data: {
				name: incoming.name ?? existing.name,
				phone: incoming.phone ?? existing.phone,
				service: incoming.service ?? existing.service,
				regNumber: incoming.regNumber ?? existing.regNumber,
				color: incoming.color ?? existing.color,
				carModel: incoming.carModel ?? existing.carModel,
				address: incoming.address ?? existing.address,
				notes: incoming.notes ?? existing.notes,
				lat: typeof incoming.lat === 'number' ? incoming.lat : existing.lat,
				lng: typeof incoming.lng === 'number' ? incoming.lng : existing.lng,
				visitTime: incoming.visitTime ?? existing.visitTime,
				visitDate:
					typeof incoming.visitDate === 'string'
						? parseVisitDate(incoming.visitDate)
						: existing.visitDate,
			},
		})

		// Обновляем сообщение-карточку и закреплённый график
		await updateWorkOrderMessage(updated)
		await updateScheduleMessage()

		return NextResponse.json({ ok: true, order: updated })
	} catch (e) {
		console.error(
			'PUT /api/work-orders/[id] failed (outer catch):',
			e ?? '(null)'
		)

		return NextResponse.json(
			{ ok: false, error: 'Server error' },
			{ status: 500 }
		)
	}
}
