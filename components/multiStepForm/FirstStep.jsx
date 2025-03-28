import { getPromoCodes } from '@/actions/promocode'
import { getServices } from '@/actions/service'
import { calculateTotalDuration, calculateTotalPrice } from '@/lib/calculating'
import { memo, useEffect, useMemo, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { QuestionIcon, SuccessCircleIcon } from '../Icons'
import Checkbox from '../ui/checkBox'
import Input from '../ui/input'
import Popover from '../ui/popover'
import { Select, SelectOption } from '../ui/select'
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

	const selectedServiceValues = watch('serviceName')
	const promoValues = watch('promocode')
	const additionalService = ['Wymiana i wyważanie kół', 'Wymiana oleju']

	// 📌 Записываем в `useState` после рендера
	useEffect(() => {
		if (selectedServiceValues) {
			setSelectedServices(selectedServiceValues)
			setPromoCode(promoValues)
			setIsAdditionalService(
				additionalService.some(item => new Set(selectedServices).has(item))
			)
		}
		if (selectedServices.length > 0) {
			setValue(
				'duration',
				calculateTotalDuration(selectedServices, services.prices)
			)
		}
	}, [selectedServices])

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
				/>
				{errors.service && (
					<p className='text-red-500'>{errors.service.message}</p>
				)}
				{isAdditionalService && (
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
									e.preventDefault() // 💡 Блокируем фокусировку
									e.stopPropagation() // 💡 На всякий случай
								}}
							>
								<QuestionIcon className='w-5 h-5' />
							</button>
						</Popover>
					</div>
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
