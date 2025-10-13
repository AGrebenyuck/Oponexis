'use server'

import { db } from '@/lib/prisma'
import { DateTime } from 'luxon'

const TIMEZONE = 'Europe/Warsaw' // Часовой пояс по умолчанию

const CLOSE_GUARD_MIN = 1

export async function getAvailability() {
	// const { userId } = await auth()
	// if (!userId) {
	// 	throw new Error('Unauthorized')
	// }

	const calendar = await db.calendar.findFirst()
	if (!calendar) {
		return null
	}
	const availability = await db.calendar.findUnique({
		where: { id: calendar.id },
		include: { days: true },
	})

	const availabilityData = {
		timeGap: availability.timeGap,
	}

	// Дни недели
	const weekdays = [
		'monday',
		'tuesday',
		'wednesday',
		'thursday',
		'friday',
		'saturday',
		'sunday',
	]

	weekdays.forEach(day => {
		const dayAvailability = availability.days.find(
			d => d.day === day.toUpperCase()
		)
		availabilityData[day] = {
			isAvailable: !!dayAvailability,
			startTime: dayAvailability
				? DateTime.fromISO(dayAvailability.startTime.toISOString(), {
						zone: TIMEZONE,
				  }).toFormat('HH:mm')
				: '09:00',
			endTime: dayAvailability
				? DateTime.fromISO(dayAvailability.endTime.toISOString(), {
						zone: TIMEZONE,
				  }).toFormat('HH:mm')
				: '17:00',
		}
	})

	return availabilityData
}

export async function updateAvailability(data) {
	// const { userId } = await auth()
	// if (!userId) {
	// 	throw new Error('Unauthorized')
	// }

	const availabilityData = Object.entries(data).flatMap(
		([day, { isAvailable, startTime, endTime }]) => {
			if (isAvailable) {
				const baseDate = DateTime.now().toISODate()
				return {
					day: day.toUpperCase(),
					startTime: DateTime.fromISO(`${baseDate}T${startTime}:00`, {
						zone: TIMEZONE,
					}).toJSDate(),
					endTime: DateTime.fromISO(`${baseDate}T${endTime}:00`, {
						zone: TIMEZONE,
					}).toJSDate(),
				}
			}
			return []
		}
	)

	const calendarExists = await db.calendar.count()

	if (calendarExists) {
		const calendar = await db.calendar.findFirst()

		await db.calendar.update({
			where: { id: calendar.id },
			data: {
				timeGap: data.timeGap,
				days:
					availabilityData.length > 0
						? { deleteMany: {}, create: availabilityData }
						: { deleteMany: {} },
			},
		})
	} else {
		if (availabilityData.length > 0) {
			await db.calendar.create({
				data: {
					timeGap: data.timeGap,
					days: { create: availabilityData },
				},
			})
		} else {
			throw new Error('Нет доступных дней для создания календаря')
		}
	}

	return { success: true }
}

// 📌 Получение доступных дней для календаря
export async function getAvailableDaysForCalendar() {
	const availability = await getAvailability()
	const startDate = DateTime.now().startOf('day')
	const endDate = startDate.plus({ days: 30 })

	const availableDays = []

	// Перебираем все дни месяца
	for (let date = startDate; date <= endDate; date = date.plus({ days: 1 })) {
		const dayOfWeek = date.toFormat('EEEE').toLowerCase()

		// Проверяем доступность дня
		if (availability[dayOfWeek]?.isAvailable) {
			availableDays.push(date.toJSDate()) // Преобразуем в стандартный Date для совместимости
		}
	}

	return availableDays
}

// 📌 Функции для работы с временем
const timeToMinutes = time => {
	const [hours, minutes] = time.split(':').map(Number)
	return hours * 60 + minutes
}

// Преобразование минут в `HH:mm`
const minutesToTime = minutes => {
	return DateTime.fromObject({
		hour: Math.floor(minutes / 60),
		minute: minutes % 60,
	}).toFormat('HH:mm')
}

export const generateAvailableSlots = async (date, duration, step = 30) => {
	const availability = await getAvailability()
	// ✅ Получаем бронирования через API, чтобы обойти кеш
	const response = await fetch(`${process.env.URL}/api/get-booking-for-date`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ date }),
		cache: 'no-store', // Дополнительно, чтобы точно не кешировалось
	})

	const bookedSlots = await response.json()

	// ✅ Универсальное преобразование даты
	const dateObj =
		typeof date === 'string'
			? DateTime.fromISO(date, { zone: TIMEZONE })
			: DateTime.fromJSDate(date, { zone: TIMEZONE })

	const dayOfWeek = dateObj.toFormat('EEEE').toLowerCase()
	const dayAvailability = availability[dayOfWeek]

	if (!dayAvailability?.isAvailable) return []

	const { startTime: open, endTime: close } = dayAvailability
	const effectiveCloseDT = dateObj
		.set({
			hour: Number(close.split(':')[0]),
			minute: Number(close.split(':')[1]),
		})
		.minus({ minutes: CLOSE_GUARD_MIN })
	const timeGap = availability.timeGap || step

	const roundUpToGap = (time, gap) => {
		const remainder = time.minute % gap
		return remainder === 0 ? time : time.plus({ minutes: gap - remainder })
	}

	const openDT = dateObj.set({
		hour: Number(open.split(':')[0]),
		minute: Number(open.split(':')[1]),
	})

	const now = DateTime.now().setZone(TIMEZONE)
	let adjustedOpenDT = openDT

	if (now.hasSame(openDT, 'day') && now.plus({ minutes: timeGap }) > openDT) {
		adjustedOpenDT = now.plus({ minutes: timeGap }).startOf('minute')
	}

	adjustedOpenDT = roundUpToGap(adjustedOpenDT, timeGap)
	if (adjustedOpenDT.plus({ minutes: duration }) > effectiveCloseDT) {
		return []
	}

	const bookedTimes = new Set()
	const blockedEnds = new Set()

	bookedSlots.forEach(({ start, end }) => {
		const dayStr = dateObj.toFormat('yyyy-MM-dd')
		const startDT = DateTime.fromISO(`${dayStr}T${start}:00`, {
			zone: TIMEZONE,
		})
		const endDT = DateTime.fromISO(`${dayStr}T${end}:00`, { zone: TIMEZONE })

		for (
			let t = timeToMinutes(startDT.toFormat('HH:mm'));
			t < timeToMinutes(endDT.toFormat('HH:mm'));
			t += timeGap
		) {
			bookedTimes.add(t)
		}

		blockedEnds.add(timeToMinutes(endDT.toFormat('HH:mm')))
	})

	const availableSlots = []
	let currentSlot = adjustedOpenDT

	while (currentSlot.plus({ minutes: duration }) <= effectiveCloseDT) {
		const slotStart = timeToMinutes(currentSlot.toFormat('HH:mm'))
		const slotEnd = slotStart + duration

		let isSlotAvailable = true

		for (let t = slotStart; t < slotEnd; t += timeGap) {
			if (bookedTimes.has(t) || blockedEnds.has(t)) {
				isSlotAvailable = false
				break
			}
		}

		if (isSlotAvailable) {
			availableSlots.push({
				start: minutesToTime(slotStart),
				end: minutesToTime(slotEnd),
			})
		}

		currentSlot = currentSlot.plus({ minutes: timeGap })
	}

	return availableSlots
}

// 📌 Генерация свободных слотов с учетом занятых
// export const generateAvailableSlots = async (date, step = 30) => {
// 	const availability = await getAvailability()
// 	const bookedSlots = await getBookingForDate(date)

// 	// ✅ Определяем день недели
// 	const dayOfWeek = DateTime.fromJSDate(date, { zone: TIMEZONE })
// 		.toFormat('EEEE')
// 		.toLowerCase()
// 	const dayAvailability = availability[dayOfWeek]

// 	// ✅ Если день недоступен — сразу выходим
// 	if (!dayAvailability?.isAvailable) return []

// 	const { startTime: open, endTime: close } = dayAvailability
// 	const timeGap = availability.timeGap || 30 // 🔹 Минимальный зазор перед новым бронированием

// 	// ✅ Функция округления вверх к ближайшему доступному слоту (например, 11:00, 11:30)
// 	const roundUpToStep = (time, step) => {
// 		const minutes = time.minute
// 		const remainder = minutes % step
// 		return remainder === 0 ? time : time.plus({ minutes: step - remainder }) // Округляем вверх
// 	}

// 	// ✅ Преобразуем рабочие часы в `DateTime`
// 	const openDT = DateTime.fromJSDate(new Date(date), { zone: TIMEZONE }).set({
// 		hour: Number(open.split(':')[0]),
// 		minute: Number(open.split(':')[1]),
// 	})

// 	const closeDT = DateTime.fromJSDate(new Date(date), { zone: TIMEZONE }).set({
// 		hour: Number(close.split(':')[0]),
// 		minute: Number(close.split(':')[1]),
// 	})

// 	// ✅ Если бронирование на **сегодня**, учитываем `timeGap`
// 	const now = DateTime.now().setZone(TIMEZONE)
// 	let adjustedOpenDT = openDT

// 	if (now.hasSame(openDT, 'day') && now.plus({ minutes: timeGap }) > openDT) {
// 		adjustedOpenDT = now.plus({ minutes: timeGap }).startOf('minute')
// 	}

// 	// ✅ Округляем `adjustedOpenDT` до ближайшего доступного слота (например, 11:30)
// 	adjustedOpenDT = roundUpToStep(adjustedOpenDT, step)

// 	// ✅ Создаём `Set` для хранения занятых минут
// 	const bookedTimes = new Set()
// 	const blockedEnds = new Set() // 🔹 Время, в которое нельзя заканчивать слоты

// 	bookedSlots.forEach(({ start, end }) => {
// 		const day = DateTime.fromJSDate(date).toFormat('yyyy-MM-dd')
// 		const startDT = DateTime.fromISO(`${day}T${start}:00`, {
// 			zone: TIMEZONE,
// 		})
// 		const endDT = DateTime.fromISO(`${day}T${end}:00`, { zone: TIMEZONE })

// 		for (
// 			let t = timeToMinutes(startDT.toFormat('HH:mm'));
// 			t < timeToMinutes(endDT.toFormat('HH:mm'));
// 			t += step
// 		) {
// 			bookedTimes.add(t)
// 		}

// 		// ❌ Добавляем время окончания брони в `blockedEnds`
// 		blockedEnds.add(timeToMinutes(endDT.toFormat('HH:mm')))
// 	})

// 	// ✅ Генерируем только свободные слоты
// 	return Array.from(
// 		{
// 			length:
// 				(timeToMinutes(closeDT.toFormat('HH:mm')) -
// 					timeToMinutes(adjustedOpenDT.toFormat('HH:mm'))) /
// 				step,
// 		},
// 		(_, i) => {
// 			const slotStart =
// 				timeToMinutes(adjustedOpenDT.toFormat('HH:mm')) + i * step
// 			const slotEnd = slotStart + step

// 			// ❌ Проверяем, что слот:
// 			// - Не пересекается с забронированным временем
// 			// - Не заканчивается в момент, когда заканчивается бронь
// 			if (!bookedTimes.has(slotStart) && !blockedEnds.has(slotStart)) {
// 				return {
// 					start: minutesToTime(slotStart),
// 					end: minutesToTime(slotEnd),
// 				}
// 			}
// 			return null
// 		}
// 	).filter(Boolean) // 🔹 Убираем `null`
// }
