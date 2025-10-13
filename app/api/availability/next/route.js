// app/api/availability/next/route.js
import {
	generateAvailableSlots,
	getAvailability,
	getAvailableDaysForCalendar,
} from '@/actions/availability'
import { DateTime } from 'luxon'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const TIMEZONE = 'Europe/Warsaw'
// мягкий буфер на выезд, минут
const LEAD_MIN = Number(process.env.AVAILABILITY_LEAD_MIN || 60)
// длительность «типовой» услуги, минут
const DEFAULT_DURATION_MIN = Number(process.env.AVAILABILITY_DEF_DURATION || 60)

function parseHM(hm) {
	const [h, m] = hm.split(':').map(Number)
	return { h, m }
}
function toMinutes(hm) {
	const { h, m } = parseHM(hm)
	return h * 60 + m
}
function fromMinutes(min) {
	const hh = Math.floor(min / 60)
	const mm = min % 60
	return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

/**
 * Схлопывает массив слотов {start:"HH:mm", end:"HH:mm"} в непрерывные диапазоны "HH:mm–HH:mm".
 * Слоты считаем «смежными», если следующий начинается ровно через timeGap минут после предыдущего начала.
 * Пример: [08:00–09:00], [08:30–09:30], timeGap=30 → общий коридор 08:00–09:30 (при длительности 60).
 */
function collapseToRanges(slots = [], timeGapMin) {
	if (!Array.isArray(slots) || !slots.length) return []

	// Отсортируем по start
	const sorted = [...slots].sort(
		(a, b) => toMinutes(a.start) - toMinutes(b.start)
	)

	const ranges = []
	let curStart = sorted[0].start
	let curEnd = sorted[0].end
	let prevStartMin = toMinutes(sorted[0].start)

	for (let i = 1; i < sorted.length; i++) {
		const s = sorted[i]
		const startMin = toMinutes(s.start)
		const endMin = toMinutes(s.end)

		// Если следующий слот стартует через timeGap минут после предыдущего старта — считаем непрерывным коридором
		if (startMin - prevStartMin === timeGapMin) {
			// расширяем конец
			if (endMin > toMinutes(curEnd)) curEnd = s.end
		} else {
			// фиксируем предыдущий коридор
			ranges.push(`${curStart}–${curEnd}`)
			curStart = s.start
			curEnd = s.end
		}
		prevStartMin = startMin
	}
	ranges.push(`${curStart}–${curEnd}`)
	return ranges
}

export async function GET(req) {
	try {
		const { searchParams } = new URL(req.url)
		const limit = Math.max(
			1,
			Math.min(20, Number(searchParams.get('limit') || 6))
		)

		const availability = await getAvailability()
		const days = await getAvailableDaysForCalendar()
		if (!availability || !days?.length) {
			return NextResponse.json({
				ok: true,
				slots: [],
				days: { today: null, tomorrow: null, next: null },
			})
		}

		const now = DateTime.now().setZone(TIMEZONE)
		const outSlots = [] // старый формат: ["Dziś 13:00", "Jutro 08:00", "Śr 22.01 10:00", ...]
		const resultDays = { today: null, tomorrow: null, next: null } // новый формат

		// подготовим ссылки на сегодня/завтра
		const todayKey = now.toFormat('yyyy-MM-dd')
		const tomorrowKey = now.plus({ days: 1 }).toFormat('yyyy-MM-dd')

		// Пройдём по доступным дням, генерируя слоты и одновременно строя "коридоры"
		for (const dayDate of days) {
			if (outSlots.length >= limit) break

			const day = DateTime.fromJSDate(dayDate, { zone: TIMEZONE })
			const isToday = day.hasSame(now, 'day')
			const isTomorrow = day.hasSame(now.plus({ days: 1 }), 'day')

			const slots = await generateAvailableSlots(
				day.toJSDate(),
				DEFAULT_DURATION_MIN,
				availability.timeGap || 30
			)

			// фильтр для сегодняшнего с учётом LEAD_MIN
			const usable = isToday
				? slots.filter(s => {
						const startDt = day.set({
							hour: Number(s.start.split(':')[0]),
							minute: Number(s.start.split(':')[1]),
						})
						return startDt >= now.plus({ minutes: LEAD_MIN })
				  })
				: slots

			// наполняем старый список для «точечных» слотов
			for (const s of usable) {
				if (outSlots.length >= limit) break
				const labelPrefix = isToday
					? 'Dziś'
					: isTomorrow
					? 'Jutro'
					: day.setLocale('pl').toFormat('ccc dd.MM')
				outSlots.push(`${labelPrefix} ${s.start}`)
			}

			// посчитаем непрерывные коридоры для сегодня/завтра (для бегущей строки)
			if (isToday || isTomorrow) {
				const ranges = collapseToRanges(usable, availability.timeGap || 30)
				const key = isToday ? 'today' : 'tomorrow'
				resultDays[key] = {
					date: day.toISODate(),
					label: isToday ? 'Dziś' : 'Jutro',
					ranges, // ["08:00–12:00", "13:00–17:00"]
				}
			}
		}

		// ближайший «дальний» день (если нет сегодня/завтра)
		if (!resultDays.today && !resultDays.tomorrow && outSlots.length) {
			// outSlots уже содержит, например: "Śr 22.01 10:00"
			resultDays.next = { label: outSlots[0] }
		}

		return NextResponse.json({
			ok: true,
			slots: outSlots.slice(0, limit),
			days: resultDays,
		})
	} catch (e) {
		console.error('GET /api/availability/next failed:', e)
		return NextResponse.json(
			{
				ok: false,
				slots: [],
				days: { today: null, tomorrow: null, next: null },
			},
			{ status: 500 }
		)
	}
}
