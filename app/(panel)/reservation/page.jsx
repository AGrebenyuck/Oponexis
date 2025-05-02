'use client'

import {
	generateAvailableSlots,
	getAvailableDaysForCalendar,
} from '@/actions/availability'
import { createReservation } from '@/actions/booking'
import { getServices } from '@/actions/service'
import { CalendarArrowLeft, CalendarArrowRight } from '@/components/Icons'
import AddressInput from '@/components/ui/addressAutoComplete'
import Button from '@/components/ui/button'
import Divider from '@/components/ui/divider'
import Input from '@/components/ui/input'
import message from '@/components/ui/message'
import Select, { SelectOption } from '@/components/ui/select'
import Spin from '@/components/ui/spin'

import TextArea from '@/components/ui/textArea'
import { useCurrentCalls } from '@/hooks/useCurrentCalls'
import useFetch from '@/hooks/useFetch'
import { calculateTotalDuration, calculateTotalPrice } from '@/lib/calculating'
import { reservationAdminSchema } from '@/lib/validators'
import { zodResolver } from '@hookform/resolvers/zod'
import { DateTime } from 'luxon'
import { useEffect, useState } from 'react'
import { DayPicker, getDefaultClassNames } from 'react-day-picker'
import { pl } from 'react-day-picker/locale'
import 'react-day-picker/style.css'
import { Controller, useForm, useWatch } from 'react-hook-form'

const AdminReservationForm = ({ allServices, onSubmit }) => {
	const {
		register,
		handleSubmit,
		control,
		setValue,
		watch,
		getValues,
		formState: { errors },
		reset,
	} = useForm({
		resolver: zodResolver(reservationAdminSchema),
		mode: 'onTouched',
	})

	const activeCalls = useCurrentCalls()
	const [services, setServices] = useState([])
	const [selectedServices, setSelectedServices] = useState([])
	const [availableDays, setAvailableDays] = useState([])
	const [selectedDate, setSelectedDate] = useState(null)
	const [selectedTime, setSelectedTime] = useState([])
	const [loadDays, setLoadDays] = useState(false)
	const serviceDuration = getValues('duration')

	const date = watch('date')
	const time = watch(['time', 'timeEnd'])
	const watchedServiceNames = useWatch({ control, name: 'serviceName' })

	useEffect(() => {
		if (!watchedServiceNames || !services.prices) return

		setSelectedServices(watchedServiceNames)

		const duration = calculateTotalDuration(
			watchedServiceNames,
			services.prices
		)
		const totalPrice = calculateTotalPrice(selectedServices, services.prices)

		setValue('price', totalPrice ?? {})
		setValue('duration', duration)
	}, [watchedServiceNames, services.prices])

	// Загружаем доступные дни
	useEffect(() => {
		document?.getElementById('secondStepForm')?.scrollIntoView({
			behavior: 'smooth',
			block: 'start',
		})
		async function fetchAvailableDays() {
			setLoadDays(true)
			const availableDates = await getAvailableDaysForCalendar(new Date())
			setAvailableDays(availableDates)
			//setSelectedDate(date ? new Date(date) : availableDates[0])
			//setSelectedTime(time)
			setLoadDays(false)
		}

		fetchAvailableDays()
	}, [])

	const {
		data: availableSlots,
		loading,
		fn: fnGenerateAvailableSlots,
	} = useFetch(generateAvailableSlots)

	useEffect(() => {
		if (selectedDate) {
			setValue('date', DateTime.fromJSDate(selectedDate).toFormat('yyyy-MM-dd'))
			if (DateTime.fromJSDate(selectedDate).toFormat('yyyy-MM-dd') !== date) {
				setValue('time', null)
				setValue('timeEnd', null)
				setSelectedTime('')
			}

			fnGenerateAvailableSlots(selectedDate, serviceDuration)
		}
		document?.getElementById('timeForm')?.scrollIntoView({
			behavior: 'smooth',
			block: 'center',
		})
	}, [selectedDate])

	useEffect(() => {
		if (selectedTime) {
			setValue('time', selectedTime[0])
			setValue('timeEnd', selectedTime[1])
		}
	}, [selectedTime])

	// Автовыбор при 1 активном звонке
	useEffect(() => {
		if (activeCalls.length === 1) {
			const call = activeCalls[0]
			setValue('activeCall', call.id)
			setValue('phone', call.phone)
		}
	}, [activeCalls, setValue])

	useEffect(() => {
		const loadServicesAndPromoCodes = async () => {
			const services = await getServices()
			setServices(services)
		}
		loadServicesAndPromoCodes()
	}, [])

	const handleAutoSelect = () => {
		if (activeCalls.length === 1) {
			const call = activeCalls[0]
			setValue('activeCall', call.id)
			setValue('phone', call.phone)
		}
	}

	const {
		loading: loadingReservation,
		errorReservation,
		data: dataFromFetch,
		fn: fnCreateBooking,
	} = useFetch(createReservation)

	const onFormSubmit = async data => {
		const TIMEZONE = 'Europe/Warsaw' // Часовой пояс

		const date = data.date
		const time = data.time

		const start = DateTime.fromISO(`${date}T${time}`, {
			zone: TIMEZONE,
		})
		const end = start.plus({ minutes: data.duration })

		const bookingData = {
			name: data.name,
			phone: data.phone,
			address: data.address,
			service: data.service.length > 1 ? 'Zestaw' : data.serviceName[0],
			comment: data.comment,
			contacts: `${data.name}, ${data.phone}`,
			startTime: start.toISO(),
			endTime: end.toISO(),
			services: data.service,
			serviceNames: data.serviceName,
			price: data.price.discountedTotal,
			serviceNameIds: data.serviceNameIds ?? [],
		}

		const result = await fnCreateBooking(bookingData)

		console.log(result)

		if (result?.success) {
			message.success('Rezerwacja została dokonana')
		} else {
			message.error('Błąd rezerwacji: ' + errorReservation)
		}
		reset()
		setSelectedDate(null)
		setSelectedTime([])
	}

	return (
		<form className='flex flex-col gap-4'>
			{/* Текущие звонки + кнопка автовыбора */}
			<div className='flex flex-col gap-2'>
				<Controller
					name='activeCall'
					control={control}
					render={({ field }) => (
						<Select
							{...field}
							placeholder='Wybierz trwające połączenie'
							onChange={val => {
								field.onChange(val)
								const call = activeCalls.find(c => c.id === val)
								if (call?.phone) {
									setValue('phone', call.phone)
								}
							}}
						>
							{activeCalls.length === 0 ? (
								<SelectOption value='' disabled>
									Brak aktywnych połączeń
								</SelectOption>
							) : (
								activeCalls.map(call => (
									<SelectOption key={call.id} value={call.id}>
										{call.phone} - {call.direction}
									</SelectOption>
								))
							)}
						</Select>
					)}
				/>
				<Button
					onClick={handleAutoSelect}
					className='w-fit'
					disabled={activeCalls.length !== 1}
				>
					Autowybierz połączenie
				</Button>
			</div>
			<Divider />
			<Input
				{...register('name')}
				placeholder='Imię'
				autoComplete='name'
				error={errors?.name}
			/>
			<Input
				{...register('phone')}
				placeholder='Telefon'
				autoComplete='tel'
				error={errors?.phone}
			/>
			<Controller
				name='address'
				control={control}
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
			{/* Услуги */}
			<Controller
				name='service'
				control={control}
				render={({ field }) => {
					const mainIds = services.prices?.map(s => s.id)
					const allSelectedIds = watch('serviceNameIds') || []

					return (
						<Select
							multiple
							value={allSelectedIds}
							onChange={selectedIds => {
								// ⏺ Сохраняем ВСЕ выбранные id (главные + подопции)
								setValue('serviceNameIds', selectedIds)

								// ⏺ Только главные id → в service
								const filteredMainIds = selectedIds.filter(id =>
									mainIds.includes(id)
								)

								// ⏺ Собираем имена всех выбранных (и главных, и подопций)
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

								field.onChange(filteredMainIds) // 💾 сохраняем только главные
								setValue('serviceName', selectedNames)
								setSelectedServices(selectedNames)
							}}
						>
							{services.prices ? (
								services.prices?.map(service => (
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
								))
							) : (
								<Spin />
							)}
						</Select>
					)
				}}
			/>
			{errors.service && (
				<p className='text-red-500'>{errors.service.message}</p>
			)}
			{/* Календарь + слоты */}
			<div
				id='secondStepForm'
				className='flex flex-col md:flex-row gap-9 lg:gap-12'
			>
				<div className='md:flex-shrink-0'>
					<Spin spinning={loadDays}>
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
								Chevron: ({ orientation, ...chevronProps }) => {
									switch (orientation) {
										case 'right':
											return (
												<CalendarArrowRight className='w-2 h-4 lg:w-4 lg:h-7' />
											)
										case 'left':
											return (
												<CalendarArrowLeft className='w-2 h-4 lg:w-4 lg:h-7' />
											)
									}
								},
							}}
							selected={selectedDate}
							onSelect={setSelectedDate}
							disabled={[{ before: new Date() }]}
						/>
					</Spin>
				</div>
				<div id='timeForm'>
					{loading ? (
						<p>Loading...</p>
					) : selectedDate && availableSlots !== undefined ? (
						<div className='mt-4'>
							<h3 className='mb-2'>
								Wolny czas na{' '}
								{DateTime.fromJSDate(selectedDate)
									.setLocale('pl')
									.toFormat('DDD')}
								:
							</h3>
							<ul className='flex flex-wrap gap-2 max-h-[270px] md:max-h-[540px] overflow-y-auto scrollbar'>
								{availableSlots?.length > 0 ? (
									availableSlots.map((slot, index) => (
										<li key={index}>
											<Button
												onClick={() => {
													setSelectedTime([slot.start, slot.end])
												}}
												type='alternative'
												className={` ${
													selectedTime[0] === slot.start
														? '!bg-accent-blue text-white hover:bg-accent-blue'
														: ''
												}`}
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
				</div>
			</div>
			{errors.date && <p className='text-red-500'>{errors.date.message}</p>}
			{errors.time && (
				<p className='text-red-500 mt-2'>{errors.time.message}</p>
			)}

			<TextArea {...register('comment')} placeholder='Dodatkowe informacje' />
			<Button
				onClick={handleSubmit(onFormSubmit, errors => {
					console.log('❌ Ошибки формы:', errors)
				})}
				disabled={loadingReservation}
			>
				{loadingReservation ? 'Rezerwacja...' : 'Dodaj rezerwację'}
			</Button>
		</form>
	)
}

export default AdminReservationForm
