// // app/api/dev/resend-workorders/route.js
// import { NextResponse } from 'next/server'
// import { db } from '@/lib/prisma'
// import {
// 	sendWorkOrderToTelegram,
// 	updateScheduleMessage,
// } from '@/lib/telegramBot'

// // 👉 ВАЖНО: это временный dev-роут,
// // не забудь потом удалить или закрыть авторизацией.
// export async function GET(req) {
// 	try {
// 		const { searchParams } = new URL(req.url)

// 		// ?ids=id1,id2,id3  (конкретные заказы)
// 		const idsParam = searchParams.get('ids')
// 		// ?date=2025-11-19  (все заказы на конкретную дату)
// 		const dateParam = searchParams.get('date')
// 		// ?limit=3
// 		const limitParam = searchParams.get('limit')

// 		let workOrders = []

// 		if (idsParam) {
// 			// вариант 1: руками указываешь id через запятую
// 			const ids = idsParam
// 				.split(',')
// 				.map(s => s.trim())
// 				.filter(Boolean)

// 			workOrders = await db.workOrder.findMany({
// 				where: { id: { in: ids } },
// 				orderBy: [{ visitDate: 'asc' }, { visitTime: 'asc' }, { id: 'asc' }],
// 			})
// 		} else if (dateParam) {
// 			// вариант 2: все заказы на указанную дату (по visitDate)
// 			// dateParam в формате YYYY-MM-DD
// 			const [y, m, d] = dateParam.split('-').map(Number)
// 			if (!y || !m || !d) {
// 				return NextResponse.json(
// 					{ ok: false, error: 'Nieprawidłowa data, użyj YYYY-MM-DD' },
// 					{ status: 400 }
// 				)
// 			}

// 			const start = new Date(y, m - 1, d, 0, 0, 0, 0)
// 			const end = new Date(y, m - 1, d + 1, 0, 0, 0, 0)

// 			const limit = limitParam ? Number(limitParam) || undefined : undefined

// 			workOrders = await db.workOrder.findMany({
// 				where: {
// 					visitDate: {
// 						gte: start,
// 						lt: end,
// 					},
// 				},
// 				orderBy: [{ visitDate: 'asc' }, { visitTime: 'asc' }, { id: 'asc' }],
// 				take: limit,
// 			})
// 		} else {
// 			return NextResponse.json(
// 				{
// 					ok: false,
// 					error:
// 						'Podaj ?ids=id1,id2 albo ?date=YYYY-MM-DD (opcjonalnie &limit=3).',
// 				},
// 				{ status: 400 }
// 			)
// 		}

// 		if (!workOrders.length) {
// 			return NextResponse.json(
// 				{ ok: false, error: 'Brak pasujących zamówień.' },
// 				{ status: 404 }
// 			)
// 		}

// 		// Отправляем каждую карточку в НОВЫЙ рабочий чат
// 		for (const order of workOrders) {
// 			// visitDate в БД — DateTime, приводим к YYYY-MM-DD
// 			let visitDateStr = null
// 			if (order.visitDate instanceof Date) {
// 				const yyyy = order.visitDate.getFullYear()
// 				const mm = String(order.visitDate.getMonth() + 1).padStart(2, '0')
// 				const dd = String(order.visitDate.getDate()).padStart(2, '0')
// 				visitDateStr = `${yyyy}-${mm}-${dd}`
// 			}

// 			await sendWorkOrderToTelegram(order, {
// 				visitDate: visitDateStr,
// 				visitTime: order.visitTime || null,
// 			})
// 		}

// 		// После того как карточки ушли — обновляем закреплённый график
// 		await updateScheduleMessage()

// 		return NextResponse.json({
// 			ok: true,
// 			count: workOrders.length,
// 			ids: workOrders.map(o => o.id),
// 		})
// 	} catch (e) {
// 		console.error('GET /api/dev/resend-workorders failed:', e)
// 		return NextResponse.json(
// 			{ ok: false, error: 'Server error' },
// 			{ status: 500 }
// 		)
// 	}
// }
