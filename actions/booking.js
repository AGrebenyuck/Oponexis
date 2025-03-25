'use server'

import { db } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { DateTime } from 'luxon'
import { createUser } from './user'
import {
	createZadarmaDeal,
	createZadarmaTask,
	updateZadarmaCustomer,
} from './zadarma'

const TIMEZONE = 'Europe/Warsaw'

export async function createReservation(bookingData) {
	try {
		const user = await auth()
		let idUser = null
		if (user.userId !== null) {
			idUser = await db.user.findUnique({
				where: { clerkUserId: user.userId },
			})
			if (idUser.phone === null) {
				await db.user.update({
					where: { clerkUserId: user.userId },
					data: {
						phone: bookingData.phone,
					},
				})

				updateZadarmaCustomer({
					id: idUser.zadarmaId,
					phone: bookingData.phone,
					name: idUser.name,
				})
			}
		} else {
			idUser = await createUser(bookingData)
		}

		const dealData = {
			title: bookingData.service,
			budget: bookingData.price,
			customer_id: idUser.zadarmaId,
		}

		const deal = await createZadarmaDeal(dealData)

		if (deal.status === 'success') {
			createZadarmaTask(bookingData, idUser.zadarmaId, deal?.data?.id)
		}

		const booking = await db.reservation.create({
			data: {
				userId: idUser.id,
				address: bookingData.address,
				serviceName: bookingData.service,
				additionalInfo: bookingData.comment,
				contactInfo: bookingData.contacts,
				promoCode: bookingData.promocode,
				startTime: bookingData.startTime,
				endTime: bookingData.endTime,
			},
		})

		if (bookingData.services?.length > 0) {
			await db.serviceReservation.createMany({
				data: bookingData.services.map(service => ({
					reservationId: booking.id,
					serviceId: service, // Должен быть id из таблицы `Service`
				})),
			})
		}

		const updatedBooking = await db.reservation.findUnique({
			where: { id: booking.id },
			include: { services: true }, // Подключаем связанные услуги
		})

		return { success: true, updatedBooking }
	} catch (error) {
		console.log(error.message)

		return { success: false, error: error.message }
	}
}

export async function getFutureReservations() {
	try {
		const user = await auth()
		if (!user) {
			throw new Error('Unauthorized')
		}

		// Получаем текущую дату и время в часовом поясе сервера
		const now = DateTime.now().toJSDate()

		// Находим все резервации, которые еще не закончились
		const reservations = await db.reservation.findMany({
			where: {
				startTime: {
					gt: now, // Запрос только будущих резерваций
				},
			},
			orderBy: {
				startTime: 'asc', // Сортируем по дате возрастанию
			},
			include: { services: true },
		})

		return { success: true, reservations }
	} catch (error) {
		console.error('Error fetching future reservations:', error)
		return { success: false, error: error.message }
	}
}

export async function getPastReservations() {
	try {
		const user = await auth()
		if (!user) {
			throw new Error('Unauthorized')
		}

		// Получаем текущую дату и время
		const now = DateTime.now().toJSDate()

		// Запрашиваем прошедшие резервации
		const reservations = await db.reservation.findMany({
			where: {
				endTime: {
					lt: now, // Запрос только прошедших резерваций
				},
			},
			orderBy: {
				startTime: 'desc', // Сортируем по дате убывания (от новых к старым)
			},
			include: { services: true },
		})

		return { success: true, reservations }
	} catch (error) {
		console.error('Error fetching past reservations:', error)
		return { success: false, error: error.message }
	}
}

export async function getBooking() {
	try {
		// 🔹 Загружаем все бронирования из БД
		const bookings = await db.reservation.findMany({
			select: {
				startTime: true,
				endTime: true,
			},
		})

		// 🔹 Группируем бронирования по `yyyy-MM-dd` в локальном времени
		const bookingsByDate = {}

		bookings.forEach(({ startTime, endTime }) => {
			// ✅ Конвертируем в локальное время
			const localStart = DateTime.fromJSDate(startTime, { zone: TIMEZONE })
			const localEnd = DateTime.fromJSDate(endTime, { zone: TIMEZONE })

			const dateKey = localStart.toFormat('yyyy-MM-dd') // 📌 Ключ для группировки

			if (!bookingsByDate[dateKey]) {
				bookingsByDate[dateKey] = []
			}

			// ✅ Сохраняем в `HH:mm` формате
			bookingsByDate[dateKey].push({
				start: localStart.toFormat('HH:mm'),
				end: localEnd.toFormat('HH:mm'),
			})
		})

		// console.log('📌 Итоговые бронирования:', bookingsByDate)
		return bookingsByDate
	} catch (error) {
		console.error('❌ Ошибка при получении бронирований:', error.message)
		return {}
	}
}

export async function getBookingForDate(date) {
	try {
		// ✅ Преобразуем входную дату в `ISO` строку, если передан объект `Date`
		const dateString =
			typeof date === 'string' ? date : DateTime.fromJSDate(date).toISODate()

		// ✅ Проверяем, удалось ли преобразовать дату
		if (!dateString) {
			throw new Error('Invalid date format')
		}

		// ✅ Создаём границы дня в `UTC`
		const startOfDayUTC = DateTime.fromISO(dateString, { zone: TIMEZONE })
			.startOf('day')
			.toUTC()
			.toJSDate()
		const endOfDayUTC = DateTime.fromISO(dateString, { zone: TIMEZONE })
			.endOf('day')
			.toUTC()
			.toJSDate()

		// ✅ Загружаем бронирования из базы
		const bookings = await db.reservation.findMany({
			where: {
				startTime: {
					gte: startOfDayUTC,
					lte: endOfDayUTC,
				},
			},
			select: {
				startTime: true,
				endTime: true,
			},
		})

		// ✅ Форматируем бронирования в `{ start: 'HH:mm', end: 'HH:mm' }`
		const formattedBookings = bookings.map(({ startTime, endTime }) => ({
			start: DateTime.fromJSDate(startTime, { zone: TIMEZONE }).toFormat(
				'HH:mm'
			),
			end: DateTime.fromJSDate(endTime, { zone: TIMEZONE }).toFormat('HH:mm'),
		}))

		return formattedBookings
	} catch (error) {
		console.error(
			`❌ Ошибка при получении бронирований для ${date}:`,
			error.message
		)
		return []
	}
}

export const updateReservation = async updatedData => {
	try {
		const response = await fetch(`${process.env.URL}/api/update-reservation`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(updatedData),
		})

		if (!response.ok) {
			throw new Error('Ошибка при обновлении бронирования')
		}

		return await response.json()
	} catch (error) {
		console.error('Ошибка при обновлении:', error)
		return { success: false, error: error.message }
	}
}

export const deleteReservation = async id => {
	try {
		const response = await fetch(`${process.env.URL}/api/delete-reservation`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ id }),
		})

		if (!response.ok) {
			throw new Error('Błąd podczas usuwania rezerwacji')
		}

		return await response.json()
	} catch (error) {
		console.error('Błąd podczas usuwania:', error)
		return { success: false, error: error.message }
	}
}
