import { z } from 'zod'
import { validateAddressOnce } from './debouncedGeocode'

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

export const reservationSchema = z
	.object({
		name: z.string().min(3, 'Imię niezbędne'),
		service: z
			.array(z.string())
			.min(1, { message: 'wybierz serwis' })
			.nonempty({ message: 'wybierz serwis' }),
		email: z.string().email('wpisz email'),
		phone: z
			.string()
			.regex(
				/^(\+?\d{1,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}$/,
				'Nieprawidłowy format numeru telefonu'
			)
			.refine(phone => {
				const digits = phone.replace(/\D/g, '')
				return digits.length >= 9 && digits.length <= 15
			}, 'Numer telefonu musi zawierać od 9 do 15 cyfr'),
		additionalInfo: z.string().optional(),
		promoCode: z.string().optional(),
		address: z
			.string()
			.min(5, 'Wprowadź dokładny adres')
			.refine(
				async val => {
					const result = await validateAddressOnce(val)
					return result
				},
				{
					message:
						'Podaj dokładny adres z numerem domu w obsługiwanym obszarze',
				}
			),
		location: z
			.object({
				lat: z.any(),
				lon: z.any(),
			})
			.optional(),
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
		vin: z.string().optional(),
		serviceNameIds: z.any().optional(),
	})

	.superRefine((data, ctx) => {
		if (data.additionalService && (!data.vin || data.vin.length < 17)) {
			ctx.addIssue({
				path: ['vin'],
				code: 'custom',
				message: 'Numer VIN musi składać się z co najmniej 17 liter',
			})
		}
	})
export const reservationAdminSchema = z.object({
	name: z.string().min(3, 'Imię niezbędne'),
	service: z
		.array(z.string())
		.min(1, { message: 'wybierz serwis' })
		.nonempty({ message: 'wybierz serwis' }),
	phone: z
		.string()
		.regex(
			/^(\+?\d{1,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}$/,
			'Nieprawidłowy format numeru telefonu'
		)
		.refine(phone => {
			const digits = phone.replace(/\D/g, '')
			return digits.length >= 9 && digits.length <= 15
		}, 'Numer telefonu musi zawierać od 9 do 15 cyfr'),
	address: z
		.string()
		.min(5, 'Wprowadź dokładny adres')
		.refine(
			async val => {
				const result = await validateAddressOnce(val)
				return result
			},
			{
				message: 'Podaj dokładny adres z numerem domu w obsługiwanym obszarze',
			}
		),
	location: z
		.object({
			lat: z.any(),
			lon: z.any(),
		})
		.optional(),
	date: z.string({
		required_error: 'wybierz date',
		invalid_type_error: 'wybierz date',
	}),
	time: z.string({
		required_error: 'wybierz czas',
		invalid_type_error: 'wybierz czas',
	}),
	comment: z.string().optional(),
	serviceName: z.array(z.string()).optional(),
	duration: z.number().optional(),
	price: z
		.object({
			baseTotal: z.number(),
			discountedTotal: z.number(),
			discountAmount: z.number(),
			discountType: z.string().nullable(),
			discountValue: z.number(),
			isDiscountApplied: z.boolean(),
			discountFromOriginal: z.number(),
		})
		.optional()
		.nullable(),
	additionalService: z.boolean().optional(),
	serviceNameIds: z.any().optional(),
})
