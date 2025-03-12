'use client'

import { createReservation } from '@/actions/booking'
import useFetch from '@/hooks/useFetch'
import { isLoggedIn } from '@/lib/checkUser'
import { reservationSchema } from '@/lib/validators'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { DateTime } from 'luxon'
import { createContext, useContext, useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import Button from '../ui/button'
import Modal from '../ui/modal'
import Result from '../ui/result'
import FirstStep from './FirstStep'
import ProgressIndicator from './ProgressIndicator'
import SecondStep from './SecondStep'
import ThirdStep from './ThirdStep'

const priceContext = createContext(null)

const MultiStepLayout = () => {
	const [step, setStep] = useState(1)
	const nextStep = () => setStep(prev => prev + 1)
	const prevStep = () => setStep(prev => prev - 1)
	const [modalVisible, setModalVisible] = useState(false)
	const [resultStatus, setResultStatus] = useState(null)
	const [resultMessage, setResultMessage] = useState('')
	const [price, setPrice] = useState([])

	const methods = useForm({
		resolver: zodResolver(reservationSchema),
		mode: 'onTouched',
		defaultValues: {
			agree: false,
			serviceName: [],
			service: [],
			isLogged: false,
		},
	})

	const {
		loading,
		data: dataFromFetch,
		fn: fnCreateBooking,
	} = useFetch(createReservation)

	const onSubmit = async (data, e) => {
		e.preventDefault()

		const TIMEZONE = 'Europe/Warsaw' // Часовой пояс

		const date = data.date
		const time = data.time

		const start = DateTime.fromISO(`${date}T${time}`, {
			zone: TIMEZONE,
		})
		const end = start.plus({ minutes: data.duration })

		const bookingData = {
			address: data.address,
			service: data.service.length > 1 ? 'Zestaw' : data.serviceName[0],
			comment: data.additionalInfo,
			contacts: `${data.name}, ${data.phone}, ${data.email}`,
			promocode: data.promocode,
			startTime: start.toISO(),
			endTime: end.toISO(),
			services: data.service,
		}

		const result = await fnCreateBooking(bookingData)

		// Проверяем, что вернула функция
		if (result?.success) {
			setResultStatus('success')
			setResultMessage('Rezerwacja została pomyślnie utworzona.')
		} else {
			setResultStatus('error')
			setResultMessage(result.error || 'Wystąpił błąd podczas rezerwacji.')
		}

		// Открываем модальное окно
		setModalVisible(true)
		reset()
		setStep(1)
	}
	const {
		register,
		reset,
		trigger,
		getValues,
		setValue,
		formState: { errors },
	} = methods

	const stepVariants = {
		hidden: { opacity: 0, x: step === 1 ? -50 : 50 },
		visible: { opacity: 1, x: 0 },
		exit: { opacity: 0, x: step === 3 ? 50 : -50 },
	}

	const [loggedIn, setLoggedIn] = useState(false)

	useEffect(() => {
		const checkAuth = async () => {
			const status = await isLoggedIn()
			setLoggedIn(status)
			setValue('isLogged', status)
		}
		checkAuth()
	}, [])

	return (
		<>
			<FormProvider {...methods}>
				<form onSubmit={methods.handleSubmit(onSubmit)} className='space-y-4'>
					<ProgressIndicator step={step} />
					<AnimatePresence mode='wait'>
						{step === 1 && (
							<motion.div
								key='step1'
								variants={stepVariants}
								initial='hidden'
								animate='visible'
								exit='exit'
								className='max-w-[972px] mx-auto'
							>
								<priceContext.Provider value={{ price, setPrice }}>
									<FirstStep />
									{errors.isLogged && (
										<p className='text-red-500'>{errors.isLogged.message}</p>
									)}
									<div className='flex gap-3 flex-col md:flex-row  justify-between md:items-center mt-4 lg:mt-12'>
										<p className={`font-semibold text-secondary-orange`}>
											Cena:{' '}
											<span
												className={`${
													price.isDiscountApplied && price.baseTotal !== 0
														? 'line-through'
														: ''
												}`}
											>
												{price.baseTotal} zł
											</span>
											{price.isDiscountApplied && price.baseTotal !== 0 && (
												<span className='text-green-500 ml-1'>
													Kod promocyjny zastosowany! Rabat{' '}
													{price.discountAmount}
													{price.discountType}
													<br />
													Całkowita cena: {price.discountedTotal.toFixed(2)} PLN
												</span>
											)}
										</p>

										<Button
											onClick={async () => {
												const isValid = await trigger([
													'email',
													'phone',
													'name',
													'address',
													'service',
													'agree',
													'isLogged',
												])

												console.log(errors)

												if (isValid) {
													nextStep()
												}
											}}
											className='w-full md:w-auto'
										>
											Dalej
										</Button>
									</div>
								</priceContext.Provider>
							</motion.div>
						)}
						{step === 2 && (
							<motion.div
								key='step2'
								variants={stepVariants}
								initial='hidden'
								animate='visible'
								exit='exit'
								className='max-w-[350px] sm:max-w-[500px] md:max-w-[750px] lg:max-w-[1042px] mx-auto'
							>
								<SecondStep />
								{errors.date && (
									<p className='text-red-500'>{errors.date.message}</p>
								)}
								{errors.time && (
									<p className='text-red-500 mt-2'>{errors.time.message}</p>
								)}
								<div className='mt-10 lg:mt-20 3xl:mt-24 flex justify-between'>
									<Button onClick={prevStep}>Powrót</Button>
									<Button
										onClick={async () => {
											const isValid = await trigger(['date', 'time'])
											if (isValid) {
												nextStep()
											}
										}}
									>
										Dalej
									</Button>
								</div>
							</motion.div>
						)}
						{step === 3 && (
							<motion.div
								key='step3'
								variants={stepVariants}
								initial='hidden'
								animate='visible'
								exit='exit'
								className='max-w-[1042px] mx-auto'
							>
								<priceContext.Provider value={price}>
									<ThirdStep />
								</priceContext.Provider>
								<div className='flex gap-10 mt-4 lg:mt-0'>
									<Button onClick={prevStep}>Powrót</Button>
									<Button onClick={methods.handleSubmit(onSubmit)}>
										{loading ? 'Rezerwacja...' : 'Rezerwacja'}
									</Button>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</form>
			</FormProvider>
			<Modal visible={modalVisible} onClose={() => setModalVisible(false)}>
				<Result
					status={resultStatus}
					title={resultStatus === 'success' ? 'Sukces!' : 'Błąd'}
					subTitle={resultMessage}
				/>
			</Modal>
		</>
	)
}

export const usePriceContext = () => useContext(priceContext)
export const useDurationContext = () => useContext(durationContext)
export default MultiStepLayout
