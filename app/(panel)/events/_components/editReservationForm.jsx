'use client'

import {
	generateAvailableSlots,
	getAvailableDaysForCalendar,
} from '@/actions/availability'
import { getPromoCodes } from '@/actions/promocode'
import { getServices } from '@/actions/service'
import { CalendarArrowLeft, CalendarArrowRight } from '@/components/Icons'
import AddressInput from '@/components/ui/addressAutoComplete'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select, { SelectOption } from '@/components/ui/select'
import Spin from '@/components/ui/spin'

import useFetch from '@/hooks/useFetch'
import { calculateTotalDuration, calculateTotalPrice } from '@/lib/calculating'
import { validateAddressOnce } from '@/lib/debouncedGeocode'
import { DateTime } from 'luxon'

import { useEffect, useRef, useState } from 'react'
import { DayPicker, getDefaultClassNames } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { pl } from 'react-day-picker/locale'
import { Controller, useForm } from 'react-hook-form'

const EditReservationForm = ({ initialData, onSave }) => {
	const [services, setServices] = useState([])
	const [promo, setPromo] = useState(null)
	const [selectedServices, setSelectedServices] = useState([])
	const [availableDays, setAvailableDays] = useState([])
	const [selectedDate, setSelectedDate] = useState(null)
	const [selectedTime, setSelectedTime] = useState([])
	const [durationService, setDurationService] = useState(0)
	const [isLoadingData, setIsLoadingData] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
	const isFirstRender = useRef(true)

	const isISODate = date => typeof date === 'string' && !isNaN(Date.parse(date))

	const {
		control,
		handleSubmit,
		setValue,
		getValues,
		watch,
		formState: { errors },
	} = useForm({
		defaultValues: {
			services: [],
			serviceName: [],
			serviceNameIds: [],
			date: new Date(initialData.startTime),
			contactInfo: initialData.contactInfo,
			address: initialData.address,
			duration: 0,
		},
	})

	const {
		data: availableSlots,
		loading,
		fn: fnGenerateAvailableSlots,
	} = useFetch(generateAvailableSlots)

	useEffect(() => {
		const fetchData = async () => {
			setIsLoadingData(true)

			const availableDates = await getAvailableDaysForCalendar(new Date())
			setAvailableDays(availableDates)

			const serviceData = await getServices()
			setServices(serviceData)

			const promocodes = await getPromoCodes()
			setPromo(promocodes.promocodes)

			const startTime = isISODate(initialData.startTime)
				? DateTime.fromISO(initialData.startTime).toFormat('HH:mm')
				: DateTime.fromJSDate(initialData.startTime).toFormat('HH:mm')

			const endTime = isISODate(initialData.endTime)
				? DateTime.fromISO(initialData.endTime).toFormat('HH:mm')
				: DateTime.fromJSDate(initialData.endTime).toFormat('HH:mm')

			const selectedIds = serviceData.prices
				.filter(service =>
					initialData.services.some(s => s.serviceId === service.id)
				)
				.map(service => service.id)

			const selectedNames = serviceData.prices
				.filter(service => selectedIds.includes(service.id))
				.map(service => service.name)

			setValue('services', selectedIds)
			setValue('serviceName', selectedNames)
			setValue('serviceNameIds', initialData.serviceNameIds)
			setSelectedServices(selectedNames)

			setSelectedDate(initialData.startTime)
			setSelectedTime([startTime, endTime])

			setIsLoadingData(false)
		}

		fetchData()
	}, [])

	useEffect(() => {
		const duration = calculateTotalDuration(selectedServices, services.prices)
		setDurationService(duration)
		const totalPrice = calculateTotalPrice(
			selectedServices,
			services.prices,
			initialData.promoCode || null,
			promo
		)

		setValue('price', totalPrice ?? {})
		setValue('duration', duration)
	}, [selectedServices, services.prices])

	useEffect(() => {
		if (selectedDate) {
			setValue('date', DateTime.fromJSDate(selectedDate).toFormat('yyyy-MM-dd'))

			if (!isFirstRender.current) {
				setSelectedTime([])
			}
			fnGenerateAvailableSlots(selectedDate, durationService)
		}
		isFirstRender.current = false
	}, [selectedDate, selectedServices])

	useEffect(() => {
		if (selectedTime.length > 0) {
			setValue('time', selectedTime[0])
			setValue('timeEnd', selectedTime[1])
		}
	}, [selectedTime, setValue])

	const onSubmit = async formData => {
		setIsSaving(true)
		formData.service =
			formData.serviceName.length > 1 ? 'Zestaw' : formData.serviceName[0]

		await onSave({ ...initialData, ...formData })
		setIsSaving(false)
	}

	if (isLoadingData) {
		return (
			<div className='flex justify-center items-center py-12'>
				<Spin size='large' />
			</div>
		)
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-8'>
			{/* Wybór usługi */}
			<Controller
				name='service'
				control={control}
				render={({ field }) => {
					const mainIds = services.prices?.map(s => s.id)
					const allSelectedIds = watch('serviceNameIds') || []

					return (
						<Select
							multiple
							position='down'
							value={allSelectedIds}
							onChange={selectedIds => {
								setValue('serviceNameIds', selectedIds)

								const filteredMainIds = selectedIds.filter(id =>
									mainIds.includes(id)
								)

								const selectedNames = selectedIds
									.map(id => {
										const main = services.prices.find(s => s.id === id)
										if (main) return main.name
										for (const s of services.prices) {
											const found = s.additionalServices?.find(
												sub => sub.id === id
											)
											if (found) return found.name
										}
										return null
									})
									.filter(Boolean)

								field.onChange(filteredMainIds)
								setValue('serviceName', selectedNames)
								setSelectedServices(selectedNames)
							}}
						>
							{services.prices?.map(service => (
								<SelectOption
									key={service.id}
									value={service.id}
									subOptions={
										service.additionalServices?.map(sub => ({
											value: sub.id,
											label: sub.name,
											price: sub.price,
										})) || []
									}
								>
									{service.name} - {service.price} PLN
								</SelectOption>
							))}
						</Select>
					)
				}}
			/>

			{/* Data */}
			<DayPicker
				mode='single'
				weekStartsOn={1}
				locale={pl}
				modifiers={{
					available: availableDays,
				}}
				modifiersClassNames={{
					available: 'bg-white text-primary-blue rounded-full opacity-85',
				}}
				classNames={{
					root: 'relative md:flex-shrink-0',
					month_caption:
						'capitalize text-base lg:text-3xl font-semibold mb-5 lg:mb-11',
					day: 'font-semibold w-[35px] h-[35px] md:w-[55px] md:h-[55px] lg:w-[75px] lg:h-[75px]',
					month_grid: 'w-full border-separate border-spacing-1',
					months: 'w-full',
					weekdays: 'text-center',
					day_button: 'flex justify-center items-center w-full h-full',
					today: '!text-accent-blue',
					nav: `${
						getDefaultClassNames().nav
					} max-w-[67px] lg:max-w-[162px] w-full justify-between`,
					selected: '!opacity-100 !bg-accent-blue !text-white',
				}}
				components={{
					Chevron: ({ orientation }) =>
						orientation === 'right' ? (
							<CalendarArrowRight className='w-2 h-4 lg:w-4 lg:h-7' />
						) : (
							<CalendarArrowLeft className='w-2 h-4 lg:w-4 lg:h-7' />
						),
				}}
				selected={selectedDate}
				onSelect={setSelectedDate}
				disabled={[{ before: new Date() }]}
			/>

			{/* Sloty */}
			{loading ? (
				<div className='flex justify-center'>
					<Spin />
				</div>
			) : selectedDate && Array.isArray(availableSlots) ? (
				<div className='mt-4'>
					<h3>
						Dostępne terminy na{' '}
						{DateTime.fromJSDate(selectedDate).toFormat('dd-MM-yyyy')}:
					</h3>
					<ul className='flex flex-wrap gap-2 max-h-[540px] overflow-y-auto scrollbar'>
						{availableSlots.length > 0 ? (
							availableSlots.map((slot, index) => (
								<li key={index}>
									<Button
										onClick={() => setSelectedTime([slot.start, slot.end])}
										type='alternative'
										className={
											selectedTime[0] === slot.start
												? '!bg-accent-blue text-white hover:bg-accent-blue'
												: ''
										}
									>
										{slot.start}
									</Button>
								</li>
							))
						) : (
							<p className='text-red-500'>Brak dostępnych terminów</p>
						)}
					</ul>
				</div>
			) : null}

			{/* Kontakt */}
			<Controller
				name='contactInfo'
				control={control}
				rules={{ required: 'Wprowadź dane kontaktowe' }}
				render={({ field }) => (
					<Input
						{...field}
						placeholder='Dane kontaktowe'
						error={errors.contactInfo?.message}
					/>
				)}
			/>

			{/* Adres */}
			<Controller
				name='address'
				control={control}
				rules={{
					required: 'Wprowadź dokładny adres',
					minLength: {
						value: 5,
						message: 'Wprowadź dokładny adres',
					},
					validate: async val => {
						const isValid = await validateAddressOnce(val)
						return (
							isValid ||
							'Podaj dokładny adres z numerem domu w obsługiwanym obszarze'
						)
					},
				}}
				render={({ field, fieldState }) => (
					<AddressInput
						value={field.value}
						onChange={field.onChange}
						onBlur={field.onBlur}
						error={fieldState.error}
						location={getValues('location') || null}
						setLocation={loc => {
							setValue('location', loc)
						}}
					/>
				)}
			/>

			{/* Przycisk zapisu */}
			<Button disabled={isSaving} onClick={handleSubmit(onSubmit)}>
				{isSaving ? 'Zapisywanie...' : 'Zapisz'}
			</Button>
		</form>
	)
}

export default EditReservationForm
