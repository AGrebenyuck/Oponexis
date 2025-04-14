'use client'

import {
	generateAvailableSlots,
	getAvailableDaysForCalendar,
} from '@/actions/availability'
import { getServices } from '@/actions/service'
import { CalendarArrowLeft, CalendarArrowRight } from '@/components/Icons'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select, { SelectOption } from '@/components/ui/select'

import useFetch from '@/hooks/useFetch'
import { calculateTotalDuration } from '@/lib/calculating'
import { DateTime } from 'luxon'

import { useEffect, useRef, useState } from 'react'
import { DayPicker, getDefaultClassNames } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { pl } from 'react-day-picker/locale'
import { Controller, useForm } from 'react-hook-form'

const EditReservationForm = ({ initialData, onSave }) => {
	const [services, setServices] = useState([])
	const [selectedServices, setSelectedServices] = useState([])
	const [availableDays, setAvailableDays] = useState([])
	const [selectedDate, setSelectedDate] = useState(null)
	const [selectedTime, setSelectedTime] = useState([])
	const [durationService, setDurationService] = useState(0)
	const isFirstRender = useRef(true) // ✅ Отслеживаем первый рендер

	const isISODate = date => typeof date === 'string' && !isNaN(Date.parse(date))

	const {
		control,
		handleSubmit,
		setValue,
		trigger,
		watch,
		formState: { errors },
	} = useForm({
		defaultValues: {
			services: [],
			serviceName: '',
			date: new Date(initialData.reservationDateStart),
			contactInfo: initialData.contactInfo,
			address: initialData.address,
			duration: 0,
		},
	})

	// ✅ Загрузка данных при первом рендере
	useEffect(() => {
		const fetchData = async () => {
			// Получаем доступные дни
			const availableDates = await getAvailableDaysForCalendar(new Date())
			setAvailableDays(availableDates)

			// Получаем список услуг
			const serviceData = await getServices()
			setServices(serviceData)

			// Устанавливаем начальные данные (дата и время)
			const startTime = isISODate(initialData.startTime)
				? DateTime.fromISO(initialData.startTime).toFormat('HH:mm')
				: DateTime.fromJSDate(initialData.startTime).toFormat('HH:mm')
			const endTime = isISODate(initialData.endTime)
				? DateTime.fromISO(initialData.endTime).toFormat('HH:mm')
				: DateTime.fromJSDate(initialData.endTime).toFormat('HH:mm')

			console.log(startTime + ' ' + endTime)

			const serviceNames = serviceData.prices
				?.filter(service =>
					initialData.services.some(
						serviceId => serviceId.serviceId === service.id
					)
				)
				.map(service => service.name)

			setSelectedServices(serviceNames)
			setSelectedDate(initialData.startTime)
			setSelectedTime([startTime, endTime])
		}

		fetchData()
	}, [])

	// ✅ Обновляем услуги после загрузки данных
	useEffect(() => {
		if (services.prices?.length > 0 && initialData?.services?.length > 0) {
			const selectedIds = services.prices
				.filter(service =>
					initialData.services.some(s => s.serviceId === service.id)
				)
				.map(service => service.id)

			const selectedNames = services.prices
				.filter(service => selectedIds.includes(service.id))
				.map(service => service.name)

			setValue('services', selectedIds)
			setValue('serviceName', selectedNames)
		}
	}, [services, initialData, setValue])

	// ✅ Запуск генерации слотов, но без сброса `selectedTime` при первом рендере
	useEffect(() => {
		if (selectedDate) {
			setValue('date', DateTime.fromJSDate(selectedDate).toFormat('yyyy-MM-dd'))

			if (!isFirstRender.current) {
				setSelectedTime([]) // Очищаем только при изменении вручную
			}
			fnGenerateAvailableSlots(selectedDate, durationService)
		}
		isFirstRender.current = false // После первого рендера флаг снимается
	}, [selectedDate, selectedServices])

	// ✅ Обновляем `durationService` при изменении выбранных услуг
	useEffect(() => {
		setDurationService(
			calculateTotalDuration(selectedServices, services.prices)
		)
		setValue('duration', durationService)
	}, [selectedServices, services.prices])

	// ✅ Запись времени в `react-hook-form`
	useEffect(() => {
		if (selectedTime.length > 0) {
			setValue('time', selectedTime[0])
			setValue('timeEnd', selectedTime[1])
		}
	}, [selectedTime, setValue])

	const {
		data: availableSlots,
		loading,
		fn: fnGenerateAvailableSlots,
	} = useFetch(generateAvailableSlots)

	const onSubmit = formData => {
		formData.serviceName =
			formData.serviceName.length > 1 ? 'Zestaw' : formData.serviceName[0]

		onSave({ ...initialData, ...formData })
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-8'>
			{/* Выбор услуги */}
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

			{/* Выбор даты */}
			<DayPicker
				mode='single'
				disabled={[{ before: new Date() }]}
				weekStartsOn={1}
				locale={pl}
				modifiers={{
					available: availableDays,
				}}
				modifiersClassNames={{
					available: 'bg-white text-primary-blue rounded-full opacity-85',
				}}
				classNames={{
					root: 'relative 2xl:flex-shrink-0',
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
			/>

			{loading ? (
				<p>Loading...</p>
			) : selectedDate && Array.isArray(availableSlots) ? (
				<div className='mt-4'>
					<h3>
						Свободные слоты на{' '}
						{DateTime.fromJSDate(selectedDate).toFormat('dd-MM-yyyy')}:
					</h3>
					<ul className='flex flex-wrap gap-2 max-h-[540px] overflow-y-auto scrollbar'>
						{availableSlots.length > 0 ? (
							availableSlots.map((slot, index) => (
								<li key={index}>
									<Button
										onClick={() => setSelectedTime([slot.start, slot.end])}
										type='alternative'
										className={`${
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
							<p className='text-red-500'>Нет доступных слотов</p>
						)}
					</ul>
				</div>
			) : null}

			{/* Контактные данные */}
			<Controller
				name='contactInfo'
				control={control}
				rules={{ required: 'Введите контактные данные' }}
				render={({ field }) => (
					<Input
						{...field}
						placeholder='Контактные данные'
						error={errors.contactInfo?.message}
					/>
				)}
			/>

			{/* Адрес */}
			<Controller
				name='address'
				control={control}
				rules={{ required: 'Введите адрес' }}
				render={({ field }) => (
					<Input
						{...field}
						placeholder='Адрес'
						error={errors.address?.message}
					/>
				)}
			/>

			{/* Кнопка сохранения */}
			<Button onClick={handleSubmit(onSubmit)}>Сохранить</Button>
		</form>
	)
}

export default EditReservationForm
