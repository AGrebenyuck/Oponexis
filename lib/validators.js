import { z } from 'zod'

export const daySchema = z
	.object({
		isAvailable: z.boolean(),
		startTime: z.string().optional(),
		endTime: z.string().optional(),
	})
	.refine(
		data => {
			if (data.isAvailable) {
				return data.startTime < data.endTime
			}
			return true
		},
		{
			message: 'End time must be more than start time',
			path: ['endTime'],
		}
	)

export const availabilitySchema = z.object({
	monday: daySchema,
	tuesday: daySchema,
	wednesday: daySchema,
	thursday: daySchema,
	friday: daySchema,
	saturday: daySchema,
	sunday: daySchema,
	timeGap: z.number().min(0, 'Time gap must be 0 or more minutes').int(),
})

export const reservationSchema = z.object({
	name: z.string().min(3, 'Imię niezbędne'),
	service: z
		.array(z.string())
		.min(1, { message: 'wybierz serwis' }) // ✅ Указываем кастомное сообщение здесь
		.nonempty({ message: 'wybierz serwis' }), // ✅ Дополнительно проверяем, чтобы массив не был пустым,
	email: z.string().email('wpisz email'),
	phone: z
		.string()
		.regex(
			/^(\+?\d{1,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}$/,
			'Nieprawidłowy format numeru telefonu'
		)
		.refine(phone => {
			// Убираем все символы кроме цифр
			const digits = phone.replace(/\D/g, '')
			return digits.length >= 9 && digits.length <= 15 // Минимальная длина 9, максимальная 15
		}, 'Numer telefonu musi zawierać od 9 do 15 cyfr'),
	additionalInfo: z.string().optional(),
	promoCode: z.string().optional(),
	address: z.string().min(1, 'adres niezbędny'),
	agree: z.boolean().refine(val => val === true, {
		message: 'Musisz zaakceptować regulamin',
	}),
	date: z.string({
		required_error: 'wybierz date',
		invalid_type_error: 'wybierz date',
	}),
	time: z.string({
		required_error: 'wybierz czas',
		invalid_type_error: 'wybierz czas',
	}),
	promocode: z.string().optional(),
	comment: z.string().optional(),
	serviceName: z.array(z.string()).optional(),
	duration: z.number().optional(),
	additionalService: z.boolean().optional(),
	vin: z.string().min(17, 'Numer VIN musi składać się z co najmniej 17 liter'),
})
