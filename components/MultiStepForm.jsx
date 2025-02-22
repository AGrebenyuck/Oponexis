'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

import { format } from 'date-fns'
import { DayPicker, getDefaultClassNames } from 'react-day-picker'
import { pl } from 'react-day-picker/locale'
import 'react-day-picker/style.css'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
	CalendarArrowLeft,
	CalendarArrowRight,
	CheckBoxCheckedIcon,
} from './Icons'
import Button from './ui/button'
import Checkbox from './ui/checkBox'
import Input from './ui/input'
import Modal from './ui/modal'
import Result from './ui/result'
import { Option, Select } from './ui/select'
import TextArea from './ui/textArea'

// Схемы валидации
const step1Schema = z.object({
	firstName: z.string().min(1, 'Имя обязательно'),
	lastName: z.string().min(1, 'Фамилия обязательна'),
	email: z.string().email('Некорректный email'),
})

const step2Schema = z.object({
	date: z.date().min(new Date(), 'Дата должна быть в будущем'),
})

const formSchema = step1Schema.merge(step2Schema)

const timeSlots = [
	'09:00',
	'09:30',
	'10:00',
	'10:30',
	'11:00',
	'11:30',
	'12:00',
	'12:30',
	'13:00',
	'13:30',
	'14:00',
	'14:30',
	'15:00',
	'15:30',
	'16:00',
]

const ProgressIndicator = ({ step }) => {
	const containerRef = useRef(null)
	const [lineWidth, setLineWidth] = useState('50px')
	const [secondLineWidth, setSecondLineWidth] = useState('50px')

	useEffect(() => {
		if (containerRef.current) {
			const steps = containerRef.current.querySelectorAll('.step')
			if (steps.length > 1) {
				const firstStep = steps[0].getBoundingClientRect()
				const secondStep = steps[1].getBoundingClientRect()
				const thirdStep = steps[2].getBoundingClientRect()
				setLineWidth(`${secondStep.left - firstStep.right + firstStep.width}px`)
				setSecondLineWidth(
					`${thirdStep.left - secondStep.right + secondStep.width}px`
				)
			}
		}
	}, [step])

	return (
		<div
			ref={containerRef}
			className='flex items-center justify-between lg:justify-around  mb-10 lg:mb-16'
		>
			{[
				{ num: 1, text: 'Dane' },
				{ num: 2, text: 'Data' },
				{ num: 3, text: 'Podsumowanie' },
			].map((s, index) => (
				<div
					key={s.num}
					className='max-w-16 flex items-center flex-col gap-1 lg:gap-4'
				>
					<motion.div
						className={`step relative w-10 h-10 lg:w-16 lg:h-16 flex items-center justify-center rounded-full border-2 ${
							s.num <= step
								? 'bg-white border-white text-primary-blue'
								: 'bg-primary-blue border-white text-white'
						}`}
						initial={{ scale: 0.8, opacity: 0.5 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ duration: 0.3 }}
					>
						<motion.div
							initial={{ scale: 0, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ duration: 0.2 }}
						>
							{s.num < step ? (
								<CheckBoxCheckedIcon className='w-4 h-3 md:w-8 md:h-5 fill-primary-blue' />
							) : (
								s.num
							)}
						</motion.div>
						{index === 0 && (
							<motion.div
								initial={{ width: '20px', backgroundColor: '#757e8a' }}
								animate={{
									width: lineWidth,
									backgroundColor: s.num < step ? '#ffffff' : '#757e8a',
								}}
								transition={{ duration: 0.4 }}
								className='h-1 absolute left-0 z-[-1]'
							></motion.div>
						)}
						{index === 1 && (
							<motion.div
								initial={{ width: '20px', backgroundColor: '#757e8a' }}
								animate={{
									width: secondLineWidth,
									backgroundColor: s.num < step ? '#ffffff' : '#757e8a',
								}}
								transition={{ duration: 0.4 }}
								className='h-1 absolute left-0 z-[-1]'
							></motion.div>
						)}
					</motion.div>
					<p className='hidden lg:block'>{s.text}</p>
				</div>
			))}
		</div>
	)
}

const MultiStepForm = () => {
	const [step, setStep] = useState(1)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [checked, setChecked] = useState(false)
	const {
		control,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			firstName: 'sjdh',
			lastName: 'sdnsa',
			email: 'text@text.com',
			date: new Date('2025-12-17T03:24:00'),
		},
	})

	const [isOpen, setIsOpen] = useState(false)

	const onSubmit = data => {
		setIsOpen(true)
	}

	const nextStep = () => setStep(prev => prev + 1)
	const prevStep = () => setStep(prev => prev - 1)

	const stepVariants = {
		hidden: { opacity: 0, x: step === 1 ? -50 : 50 },
		visible: { opacity: 1, x: 0 },
		exit: { opacity: 0, x: step === 3 ? 50 : -50 },
	}

	return (
		<>
			<Modal visible={isOpen} onClose={() => setIsOpen(false)}>
				<Result
					status='info'
					title='Błąd!'
					subTitle='Funkcja narazie jest niedostępna'
				/>
			</Modal>
			<form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
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
							<div className='flex flex-col gap-3 lg:gap-11'>
								<Input placeholder='Imię' />
								<Input placeholder='Telefon' />
								<Input placeholder='Email' />
								<Input placeholder='Adres' />
								<Select onChange={val => console.log('Выбрано:', val)}>
									<Option value='Wymiana i wyważanie kół'>
										Wymiana i wyważanie kół
									</Option>
									<Option value='Wymiana oleju'>Wymiana oleju</Option>
									<Option value='Serwis klimatyzacji'>
										Serwis klimatyzacji
									</Option>
									<Option value='Sezonowa wymiana opon'>
										Sezonowa wymiana opon
									</Option>
									<Option value='Przechowywanie kół w naszym magazynie'>
										Przechowywanie kół w naszym magazynie
									</Option>
								</Select>
								<Input placeholder='Promocode' />
								<TextArea placeholder='Dodatkowa informacja' />
							</div>
							<Checkbox
								label='Wyrażam zgodę na przetwarzanie moich danych osobowych.'
								checked={checked}
								onChange={() => setChecked(!checked)}
								className='mt-5'
							/>
							<div className='flex gap-3 flex-col md:flex-row  justify-between md:items-center mt-4 lg:mt-12'>
								<p className='font-semibold text-secondary-orange'>
									Cena: <span>100</span>
								</p>
								<Button onClick={nextStep} className='w-full md:w-auto'>
									Dalej
								</Button>
							</div>
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
							<div className='flex flex-col flex-shrink-0 md:flex-row gap-9 lg:gap-12'>
								<DayPicker
									mode='single'
									weekStartsOn={1}
									locale={pl}
									classNames={{
										root: 'relative',
										month_caption:
											'capitalize text-base lg:text-3xl font-semibold mb-5 lg:mb-11',
										day: 'font-semibold w-[35px] h-[35px] md:w-[55px] md:h-[55px] lg:w-[75px] lg:h-[75px]',
										month_grid: 'w-full',
										months: 'w-full',
										weekdays: 'text-center',
										day_button:
											'flex justify-center items-center w-full h-full',
										today: 'text-accent-blue',
										nav: `${
											getDefaultClassNames().nav
										} max-w-[67px] lg:max-w-[162px] w-full justify-between`,
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
								/>
								<div className='max-w-full md:max-w-[300px] lg:max-w-[468px]'>
									<h4 className='font-semibold mb-5 md:mb-10'>
										Dostępne przedziały czasowe
									</h4>
									<ul className='flex flex-wrap justify-center gap-2 md:gap-4'>
										{timeSlots.map((time, index) => {
											return (
												<li key={index}>
													<button
														type='button'
														className='px-3 py-2 lg:px-7 lg:py-4 font-semibold border border-white rounded-xl md:rounded-3xl hover:bg-white hover:text-primary-blue transition-all'
													>
														{time}
													</button>
												</li>
											)
										})}
									</ul>
								</div>
							</div>
							<div className='mt-10 lg:mt-20 3xl:mt-24 flex justify-between'>
								<Button onClick={prevStep}>Powrót</Button>
								<Button onClick={nextStep}>Dalej</Button>
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
							<h2 className='font-semibold mb-5 lg:mb-16'>Dane</h2>
							<table className='border-separate border-spacing-3 lg:border-spacing-y-10'>
								<tbody>
									<tr>
										<td>Name:</td>
										<td className='font-semibold pl-3'>Piotr</td>
									</tr>
									<tr>
										<td>Telefon:</td>
										<td className='font-semibold pl-3'>+48765321456</td>
									</tr>
									<tr>
										<td>Email:</td>
										<td className='font-semibold pl-3'>test@test@.com</td>
									</tr>
									<tr>
										<td>Adres:</td>
										<td className='font-semibold pl-3'>
											ul. Piotrkowska 120, 90-006 Łódź, Polska
										</td>
									</tr>
									<tr>
										<td>Usługa:</td>
										<td className='font-semibold pl-3'>Wymiana koł</td>
									</tr>
									<tr>
										<td>Data:</td>
										<td className='font-semibold pl-3'>
											10:00-11:00, 29.01.2025
										</td>
									</tr>
									<tr>
										<td>Cena:</td>
										<td className='font-semibold pl-3'>100zł</td>
									</tr>
								</tbody>
							</table>
							{/* Итоговая информация */}
							<div className='flex gap-10 mt-4 lg:mt-0'>
								<Button onClick={prevStep}>Powrót</Button>
								<Button
									onClick={handleSubmit(onSubmit)}
									disabled={isSubmitting}
								>
									{isSubmitting ? 'Rezerwacja...' : 'Rezerwacja'}
								</Button>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</form>
		</>
	)
}

export default MultiStepForm
