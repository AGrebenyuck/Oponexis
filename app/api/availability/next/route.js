import { db } from '@/lib/prisma'
import { DateTime } from 'luxon'
import { NextResponse } from 'next/server'

const ZONE = 'Europe/Warsaw'

// рабочий день
const WORK_DAY_START_MIN = 12 * 60 // 12:00
const WORK_DAY_END_MIN = 20 * 60 // 20:00
const SLOT_STEP_MIN = 15 // шаг для "slots" (минуты)
const DEFAULT_DURATION_MIN = 60 // дефолтная длительность, если не нашли

// 🔹 буфер на дорогу до клиента / от клиента
const TRAVEL_BUFFER_MIN = 30

/* ========= time helpers ========= */

function timeToMinutes(str) {
	if (!str) return null
	const [h, m] = String(str).split(':').map(Number)
	if (Number.isNaN(h) || Number.isNaN(m)) return null
	return h * 60 + m
}

function minutesToTime(min) {
	const h = Math.floor(min / 60)
	const m = min % 60
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** duration для WorkOrder по названию услуги (order.service) */
function getDurationForOrder(order, durationByName) {
	if (!order?.service) return DEFAULT_DURATION_MIN

	const parts = order.service
		.split('+')
		.map(p => p.trim().toLowerCase())
		.filter(Boolean)

	if (!parts.length) return DEFAULT_DURATION_MIN

	const durations = parts
		.map(name => durationByName.get(name))
		.filter(d => typeof d === 'number' && d > 0)

	if (!durations.length) return DEFAULT_DURATION_MIN

	return Math.max(...durations)
}

/** Занятые интервалы в пределах рабочего дня [WORK_DAY_START_MIN, WORK_DAY_END_MIN] */
function buildBusyIntervalsForDay(ordersForDay, durationByName) {
	const intervals = []

	for (const o of ordersForDay) {
		if (!o.visitTime) continue
		const startMin = timeToMinutes(o.visitTime)
		if (startMin == null) continue

		const dur = getDurationForOrder(o, durationByName)
		let endMin = startMin + dur

		// обрезаем по рабочему дню
		if (endMin <= WORK_DAY_START_MIN || startMin >= WORK_DAY_END_MIN) {
			continue
		}
		const s = Math.max(startMin, WORK_DAY_START_MIN)
		const e = Math.min(endMin, WORK_DAY_END_MIN)
		if (e > s) intervals.push([s, e])
	}

	if (!intervals.length) return []

	intervals.sort((a, b) => a[0] - b[0])

	const merged = []
	let [curStart, curEnd] = intervals[0]

	for (let i = 1; i < intervals.length; i++) {
		const [s, e] = intervals[i]
		if (s <= curEnd) {
			curEnd = Math.max(curEnd, e)
		} else {
			merged.push([curStart, curEnd])
			curStart = s
			curEnd = e
		}
	}
	merged.push([curStart, curEnd])
	return merged
}

/**
 * Свободные интервалы как дополнение к busy
 * dayStartMin/dayEndMin позволяют для "сегодня" начинать от текущего времени
 */
function buildFreeIntervalsFromBusy(busy, dayStartMin, dayEndMin) {
	const free = []
	let cursor = dayStartMin

	for (const [s, e] of busy) {
		// busy уже в рамках рабочего окна, но всё равно подстрахуемся
		if (e <= dayStartMin || s >= dayEndMin) continue

		const bs = Math.max(s, dayStartMin)
		const be = Math.min(e, dayEndMin)

		if (bs > cursor) {
			free.push([cursor, bs])
		}
		cursor = Math.max(cursor, be)
	}

	if (cursor < dayEndMin) {
		free.push([cursor, dayEndMin])
	}

	return free
}

/**
 * 🔹 Режем свободные интервалы, учитывая буфер на дорогу.
 * На каждом свободном окне откусываем TRAVEL_BUFFER_MIN с начала и конца.
 */
function applyTravelBufferToFreeIntervals(free, bufferMin = TRAVEL_BUFFER_MIN) {
	if (!bufferMin) return free

	return (
		free
			.map(([s, e]) => [s + bufferMin, e - bufferMin])
			// можно требовать хотя бы 30 минут, чтобы слот имел смысл
			.filter(([s, e]) => e - s >= 30)
	)
}

/** Превращаем интервалы в строки "HH:MM–HH:MM" */
function intervalsToRanges(intervals, minLength = 15) {
	return intervals
		.filter(([s, e]) => e - s >= minLength)
		.map(([s, e]) => `${minutesToTime(s)}–${minutesToTime(e)}`)
}

/** строим "плоские" слоты для fallback-поля slots */
function buildFlatSlotsLabel(dayLabel, freeIntervals, limit) {
	const slots = []
	for (const [s, e] of freeIntervals) {
		for (let t = s; t + 15 <= e; t += SLOT_STEP_MIN) {
			slots.push(`${dayLabel} ${minutesToTime(t)}`)
			if (slots.length >= limit) return slots
		}
	}
	return slots
}

/* ========= API handler ========= */

export async function GET(req) {
	try {
		const { searchParams } = new URL(req.url)
		const limit = Number(searchParams.get('limit') || '12') || 12

		const now = DateTime.now().setZone(ZONE)
		const today = now.startOf('day')
		const tomorrow = today.plus({ days: 1 })
		const afterTomorrow = today.plus({ days: 2 })

		const todayISO = today.toISODate()
		const tomorrowISO = tomorrow.toISODate()
		const afterTomorrowISO = afterTomorrow.toISODate()

		// Все WorkOrder с визитами на 3 дня вперёд
		const orders = await db.workOrder.findMany({
			where: {
				visitDate: {
					gte: today.toJSDate(),
					lt: afterTomorrow.plus({ days: 1 }).toJSDate(),
				},
				visitTime: { not: null },
			},
			orderBy: [{ visitDate: 'asc' }, { visitTime: 'asc' }, { id: 'asc' }],
		})

		// Все услуги с duration
		const services = await db.service.findMany({
			select: { name: true, duration: true },
		})
		const durationByName = new Map()
		for (const s of services) {
			if (s.name && typeof s.duration === 'number') {
				durationByName.set(s.name.trim().toLowerCase(), s.duration)
			}
		}

		// Группируем заказы по дате (yyyy-MM-dd по Польше)
		const ordersByDayKey = new Map()
		for (const o of orders) {
			if (!o.visitDate) continue
			const dt = DateTime.fromJSDate(o.visitDate, { zone: ZONE }).startOf('day')
			if (!dt.isValid) continue
			const key = dt.toISODate()
			if (!ordersByDayKey.has(key)) ordersByDayKey.set(key, [])
			ordersByDayKey.get(key).push(o)
		}

		// старт "рабочего окна" для сегодня: от текущего времени
		const nowMinutes = now.hour * 60 + now.minute
		const todayStartMin = Math.max(WORK_DAY_START_MIN, nowMinutes)

		// helper: собрать структуру по дню
		const mkDayStruct = (isoKey, isToday) => {
			const dayOrders = ordersByDayKey.get(isoKey) || []
			const busy = buildBusyIntervalsForDay(dayOrders, durationByName)

			const dayStart = isToday ? todayStartMin : WORK_DAY_START_MIN
			const dayEnd = WORK_DAY_END_MIN

			// если уже позже рабочего дня — свободных нет
			if (dayStart >= dayEnd) {
				return { ranges: [], free: [] }
			}

			// сначала обычные свободные интервалы
			const freeRaw = buildFreeIntervalsFromBusy(busy, dayStart, dayEnd)
			// затем режем края с учётом буфера на дорогу
			const free = applyTravelBufferToFreeIntervals(freeRaw, TRAVEL_BUFFER_MIN)

			const ranges = intervalsToRanges(free, 15)
			return { ranges, free }
		}

		const todayStruct = mkDayStruct(todayISO, true)
		const tomorrowStruct = mkDayStruct(tomorrowISO, false)
		const nextStruct = mkDayStruct(afterTomorrowISO, false)

		// собираем flat slots (fallback)
		const slots = []

		if (todayStruct.free.length) {
			slots.push(
				...buildFlatSlotsLabel('Dziś', todayStruct.free, limit - slots.length)
			)
		}
		if (slots.length < limit && tomorrowStruct.free.length) {
			slots.push(
				...buildFlatSlotsLabel(
					'Jutro',
					tomorrowStruct.free,
					limit - slots.length
				)
			)
		}
		if (slots.length < limit && nextStruct.free.length) {
			slots.push(
				...buildFlatSlotsLabel(
					'Pojutrze',
					nextStruct.free,
					limit - slots.length
				)
			)
		}

		return NextResponse.json({
			ok: true,
			days: {
				today: { ranges: todayStruct.ranges },
				tomorrow: { ranges: tomorrowStruct.ranges },
				next: { ranges: nextStruct.ranges },
			},
			slots,
		})
	} catch (e) {
		console.error('/api/availability/next FAILED:', e)
		return NextResponse.json(
			{ ok: false, error: 'Server error' },
			{ status: 500 }
		)
	}
}
