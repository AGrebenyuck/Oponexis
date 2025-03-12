import { getPromoCodes } from '@/actions/promocode'
import { getServices } from '@/actions/service'
import { calculateTotalDuration, calculateTotalPrice } from '@/lib/calculating'
import { useEffect, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import Checkbox from '../ui/checkBox'
import Input from '../ui/input'
import { Select, SelectOption } from '../ui/select'
import TextArea from '../ui/textArea'
import { usePriceContext } from './MultiStepLayout'

const FirstStep = () => {
	const {
		register,
		control,
		setValue,
		formState: { errors },
		trigger,
	} = useFormContext()
	const { setPrice } = usePriceContext()
	const [services, SetServices] = useState([])
	const [selectedServices, setSelectedServices] = useState([])
	const [promoCode, setPromoCode] = useState('')
	const [availablePromoCodes, setAvailablePromoCodes] = useState([])
	const [totalPrice, setTotalPrice] = useState({
		baseTotal: 0,
		discountedTotal: 0,
	})

	useEffect(() => {
		const loadServices = async () => {
			const services = await getServices()
			SetServices(services)
		}
		loadServices()
	}, [])

	useEffect(() => {
		// Загружаем доступные промокоды при монтировании компонента
		const loadPromoCodes = async () => {
			const codes = await getPromoCodes()
			setAvailablePromoCodes(codes)
		}
		loadPromoCodes()
	}, [])

	useEffect(() => {
		setTotalPrice(
			calculateTotalPrice(
				selectedServices,
				services.prices,
				promoCode.target,
				availablePromoCodes.promocodes
			)
		)
		setValue(
			'duration',
			calculateTotalDuration(selectedServices, services.prices)
		)
	}, [selectedServices, promoCode, availablePromoCodes])

	useEffect(() => {
		setPrice(totalPrice)
	}, [totalPrice])

	return (
		<>
			<div className='flex flex-col gap-3 lg:gap-11'>
				<Input {...register('name')} placeholder='Imię' />
				<Input
					{...register('phone')}
					type='tel'
					placeholder='Telefon'
					onChange={e => setValue('phone', e.target.value)}
				/>
				<Input {...register('email')} type='email' placeholder='Email' />
				<Input {...register('address')} placeholder='Adres' />
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
				<Input
					{...register('promocode')}
					placeholder='Promocode'
					onChange={val => {
						setPromoCode(val)
					}}
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
}

export default FirstStep
