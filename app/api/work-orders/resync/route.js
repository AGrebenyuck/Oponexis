// app/api/work-orders/resync/route.js
import { NextResponse } from 'next/server'
import { db } from '@/lib/prisma'
import {
	sendWorkOrderToTelegram,
	updateScheduleMessage,
} from '@/lib/telegramBot'

// YYYY-MM-DD → Date (UTC 00:00)
function parseYmdToUtcStart(str) {
	if (!str) return null
	const [y, m, d] = String(str).split('-').map(Number)
	if (!y || !m || !d) return null
	return new Date(Date.UTC(y, m - 1, d, 0, 0, 0))
}

// YYYY-MM-DD → Date (UTC 23:59:59.999)
function parseYmdToUtcEnd(str) {
	if (!str) return null
	const [y, m, d] = String(str).split('-').map(Number)
	if (!y || !m || !d) return null
	return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999))
}

async function resyncRange(fromStr, toStr) {
	if (!fromStr || !toStr) {
		return {
			ok: false,
			error: 'Both "from" and "to" must be provided as YYYY-MM-DD',
			status: 400,
		}
	}

	const fromDate = parseYmdToUtcStart(fromStr)
	const toDate = parseYmdToUtcEnd(toStr)

	if (!fromDate || !toDate) {
		return {
			ok: false,
			error: 'Invalid "from" or "to" date format (expected YYYY-MM-DD)',
			status: 400,
		}
	}

	if (fromDate > toDate) {
		return {
			ok: false,
			error: '"from" must be <= "to"',
			status: 400,
		}
	}

	console.log(
		'[resyncWorkOrders] range:',
		fromStr,
		'->',
		toStr,
		'UTC:',
		fromDate.toISOString(),
		'..',
		toDate.toISOString()
	)

	// 1) Находим все заказы в диапазоне
	const orders = await db.workOrder.findMany({
		where: {
			visitDate: {
				gte: fromDate,
				lte: toDate,
			},
			visitTime: {
				not: null,
			},
		},
		orderBy: [{ visitDate: 'asc' }, { visitTime: 'asc' }, { id: 'asc' }],
	})

	console.log('[resyncWorkOrders] found orders count =', orders.length)

	// 2) Для каждого заказа заново отправляем карточку в рабочий чат
	let sentCount = 0

	for (const o of orders) {
		// приводим дату к строке YYYY-MM-DD, как при обычной отправке
		const visitDateStr = o.visitDate
			? o.visitDate.toISOString().slice(0, 10)
			: null

		try {
			await sendWorkOrderToTelegram(o, {
				visitDate: visitDateStr,
				visitTime: o.visitTime,
			})
			sentCount++
		} catch (err) {
			console.error(
				'[resyncWorkOrders] failed to send work order to Telegram, id =',
				o.id,
				err
			)
		}
	}

	// 3) После массовой отправки — обновляем закреплённый график
	try {
		await updateScheduleMessage()
	} catch (err) {
		console.error('[resyncWorkOrders] updateScheduleMessage failed:', err)
	}

	return {
		ok: true,
		count: orders.length,
		sent: sentCount,
		status: 200,
	}
}

// ============= GET =============
// /api/work-orders/resync?from=2025-11-19&to=2025-11-21
export async function GET(req) {
	try {
		const { searchParams } = new URL(req.url)
		const from = searchParams.get('from')
		const to = searchParams.get('to')

		const result = await resyncRange(from, to)
		const { status, ...payload } = result

		return NextResponse.json(payload, { status })
	} catch (e) {
		console.error('GET /api/work-orders/resync failed:', e ?? '(null)')
		return NextResponse.json(
			{ ok: false, error: 'Server error' },
			{ status: 500 }
		)
	}
}

// ============= POST =============
// body: { "from": "2025-11-19", "to": "2025-11-21" }
export async function POST(req) {
	try {
		const body = await req.json().catch(() => ({}))
		const { from, to } = body || {}

		const result = await resyncRange(from, to)
		const { status, ...payload } = result

		return NextResponse.json(payload, { status })
	} catch (e) {
		console.error('POST /api/work-orders/resync failed:', e ?? '(null)')
		return NextResponse.json(
			{ ok: false, error: 'Server error' },
			{ status: 500 }
		)
	}
}
