import { getPromoCodes } from '@/actions/promocode'
import { getServices } from '@/actions/service'
import { calculateTotalDuration, calculateTotalPrice } from '@/lib/calculating'
import { memo, useEffect, useMemo, useState } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'

import { QuestionIcon, SuccessCircleIcon } from '../Icons'
import Checkbox from '../ui/checkBox'
import Input from '../ui/input'
import Popover from '../ui/popover'

import Select, { SelectOption } from '../ui/select'
import TextArea from '../ui/textArea'
import { usePriceContext } from './MultiStepLayout'

const FirstStep = memo(() => {
	const {
		register,
		control,
		setValue,
		getValues,
		watch,
		formState: { errors },
		trigger,
	} = useFormContext()
	const { setPrice } = usePriceContext()
	const [services, setServices] = useState([])
	const [selectedServices, setSelectedServices] = useState([])
	const [promoCode, setPromoCode] = useState('')
	const [availablePromoCodes, setAvailablePromoCodes] = useState([])
	const [isAdditionalService, setIsAdditionalService] = useState(false)

	const promoValues = watch('promocode')
	const isAdditionalServiceChecked = watch('additionalService')
	const additionalService = ['Wymiana i wyważanie kół', 'Wymiana oleju']

	// 📌 Записываем в `useState` после рендера
	const watchedServiceNames = useWatch({ name: 'serviceName' })

	useEffect(() => {
		if (!watchedServiceNames || !services.prices) return

		setPromoCode(promoValues)
		setSelectedServices(watchedServiceNames)

		const hasExtra = additionalService.some(item =>
			watchedServiceNames.includes(item)
		)
		setIsAdditionalService(hasExtra)

		const duration = calculateTotalDuration(
			watchedServiceNames,
			services.prices
		)
		setValue('duration', duration)
	}, [watchedServiceNames, services.prices])

	// Записываем значения в useState только по мере необходимости
	useEffect(() => {
		const loadServicesAndPromoCodes = async () => {
			const [services, promoCodes] = await Promise.all([
				getServices(),
				getPromoCodes(),
			])
			setServices(services)
			setAvailablePromoCodes(promoCodes)
		}
		loadServicesAndPromoCodes()
	}, [])

	const totalPriceMemo = useMemo(() => {
		return calculateTotalPrice(
			selectedServices,
			services.prices,
			promoCode,
			availablePromoCodes.promocodes
		)
	}, [selectedServices, promoCode, availablePromoCodes])

	useEffect(() => {
		setPrice(totalPriceMemo)
	}, [totalPriceMemo])

	return (
		<>
			<div className='flex flex-col gap-3 lg:gap-11'>
				<Input {...register('name')} placeholder='Imię' autoComplete='name' />
				<Input
					{...register('phone')}
					type='tel'
					placeholder='Telefon'
					autoComplete='tel'
					onChange={e => setValue('phone', e.target.value)}
				/>
				<Input
					{...register('email')}
					type='email'
					placeholder='Email'
					autoComplete='email'
				/>
				<Input
					{...register('address')}
					placeholder='Adres'
					autoComplete='street-address'
				/>
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

				{/* <Controller
					name='service'
					control={control}
					render={({ field }) => {
						return (
							<Select
								{...field}
								multiple
								value={services.prices
									?.filter(service => field.value?.includes(service.id))
									.map(service => service.name)}
								onChange={selectedValues => {
									// Получаем id выбранных услуг
									const selectedServices = selectedValues
										.map(name =>
											services.prices.find(service => service.name === name)
										)
										.filter(Boolean) // Убираем undefined

									// Разделяем на id и name
									const selectedIds = selectedServices.map(
										service => service.id
									)
									const selectedNames = selectedServices.map(
										service => service.name
									)

									// Записываем в `react-hook-form`
									field.onChange(selectedIds) // ✅ ID услуг

									setValue('serviceName', selectedNames) // ✅ Имена услуг

									setSelectedServices(selectedNames)
									trigger('service')
								}}
							>
								{services.prices?.map(service => (
									<SelectOption key={service.name} value={service.name}>
										{service.name} - {service.price} PLN
									</SelectOption>
								))}
							</Select>
						)
					}}
				/> */}
				{errors.service && (
					<p className='text-red-500'>{errors.service.message}</p>
				)}
				{isAdditionalService && (
					<>
						<div className='flex items-center gap-2'>
							<Controller
								name='additionalService'
								control={control}
								render={({ field }) => (
									<Checkbox
										checked={field.value}
										onChange={checked => {
											setValue(`additionalService`, checked)
										}}
										label={`Nie posiadam własnych części zamiennych
									`}
									/>
								)}
							/>
							<Popover content='Jeżeli nie posiadasz własnych części zamiennych, zadzwonimy do Ciebie w celu wyjaśnienia zakupu.'>
								<button
									type='button'
									onMouseDown={e => {
										e.preventDefault()
										e.stopPropagation()
									}}
								>
									<QuestionIcon className='w-5 h-5' />
								</button>
							</Popover>
						</div>
						{isAdditionalServiceChecked && (
							<Input {...register('vin')} type='text' placeholder='Vin Numer' />
						)}
					</>
				)}
				<Input
					{...register('promocode')}
					placeholder='Promocode'
					onChange={val => {
						setPromoCode(val.target.value) // ✅ Обновляет `useState`
					}}
					suffix={
						totalPriceMemo.isDiscountApplied ? (
							<SuccessCircleIcon className='w-6 h-6' />
						) : null
					}
				/>
				<TextArea {...register('comment')} placeholder='Dodatkowa informacja' />
			</div>
			<Controller
				name='agree'
				control={control}
				render={({ field }) => (
					<Checkbox
						checked={field.value}
						onChange={checked => {
							setValue(`agree`, checked)
							trigger('agree')
						}}
						label={'Wyrażam zgodę na przetwarzanie moich danych osobowych.'}
						className='mt-5'
					/>
				)}
			/>
			{errors.agree && <p className='text-red-500'>{errors.agree.message}</p>}
		</>
	)
})

export default FirstStep
