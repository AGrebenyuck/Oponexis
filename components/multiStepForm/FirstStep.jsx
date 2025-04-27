import { getPromoCodes } from '@/actions/promocode'
import { getServices } from '@/actions/service'
import { calculateTotalDuration, calculateTotalPrice } from '@/lib/calculating'
import { memo, useEffect, useMemo, useState } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'

import { QuestionIcon, SuccessCircleIcon } from '../Icons'
import Checkbox from '../ui/checkBox'
import Input from '../ui/input'
import Popover from '../ui/popover'

import Link from 'next/link'

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
	const [availablePromoCodes, setAvailablePromoCodes] = useState([])
	const [isAdditionalService, setIsAdditionalService] = useState(false)

	const promoValues = watch('promocode')
	const promoCode = watch('promocode')
	const isAdditionalServiceChecked = watch('additionalService')
	const additionalService = ['Wymiana i wyważanie kół', 'Wymiana oleju']

	// 📌 Записываем в `useState` после рендера
	const watchedServiceNames = useWatch({ name: 'serviceName' })

	const privacyPolicy = () => {
		return (
			<p>
				Wyrażam zgodę na{' '}
				<Link className='text-secondary-orange' href={'/privacy-policy'}>
					przetwarzanie moich danych osobowych
				</Link>
				.
			</p>
		)
	}

	useEffect(() => {
		if (!watchedServiceNames?.length || !services?.prices?.length) return

		// Только если есть совпадения по id
		const validSelectedServices = watchedServiceNames.filter(name => {
			const allServices = [
				...(services.prices || []).map(s => s.name),
				...(services.prices || []).flatMap(
					s => s.additionalServices?.map(sub => sub.name) || []
				),
			]
			return allServices.includes(name)
		})

		if (validSelectedServices.length !== watchedServiceNames.length) {
			// Если в services нет таких имен => не трогаем!
			return
		}

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

			// ⏺️ После загрузки данных – пересчитываем цену!
			const selectedNames = getValues('serviceName') || []
			const promocodeValue = getValues('promocode') || ''

			const recalculatedPrice = calculateTotalPrice(
				selectedNames,
				services.prices,
				promocodeValue,
				promoCodes.promocodes
			)

			setPrice(recalculatedPrice)
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
	}, [selectedServices, promoCode, availablePromoCodes, services.prices])

	useEffect(() => {
		setPrice(totalPriceMemo)
	}, [totalPriceMemo])

	return (
		<>
			<div className='flex flex-col gap-3 lg:gap-11'>
				{/* <AddressAutocomplete /> */}
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
						label={privacyPolicy()}
						className='mt-5'
					/>
				)}
			/>
			{errors.agree && <p className='text-red-500'>{errors.agree.message}</p>}
		</>
	)
})

export default FirstStep
