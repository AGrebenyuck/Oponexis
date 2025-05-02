import Popover from '@/components/ui/popover'
import Rate from '@/components/ui/rate'
import TextArea from '@/components/ui/textArea'
import { motion } from 'framer-motion'
import { DateTime } from 'luxon'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

const ReservationCard = ({
	id,
	userId,
	serviceName,
	startTime: reservationDateStart,
	endTime: reservationDateEnd,
	contactInfo: contact,
	address,
	promoCode,
	additionalInfo,
	status = 'pending',
	past = false, // 🟢 Указывает, что резервация прошлая
	onEdit,
	onDelete,
}) => {
	const [showForm, setShowForm] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const { control, handleSubmit, setValue, reset } = useForm({
		defaultValues: {
			rating: 5,
			text: '',
		},
	})

	const handleDelete = async () => {
		setIsDeleting(true)
		try {
			await onDelete?.()
		} catch (error) {
			console.error('❌ Błąd podczas usuwania:', error)
		}
	}

	const handleSaveComment = data => {
		const commentData = {
			userId,
			serviceName,
			rating: data.rating,
			text: data.text,
		}

		console.log('📩 Отправка комментария:', commentData)
		// 🔹 Тут можно отправить commentData на сервер через fetch()

		reset()
		setShowForm(false)
	}

	const isISODate = date => typeof date === 'string' && !isNaN(Date.parse(date))
	const isJSDate = date => date instanceof Date && !isNaN(date.getTime())

	const TIMEZONE = 'Europe/Warsaw'

	const startDate = isISODate(reservationDateStart)
		? DateTime.fromISO(reservationDateStart, { zone: TIMEZONE })
		: DateTime.fromJSDate(reservationDateStart, { zone: TIMEZONE })

	const endDate = isISODate(reservationDateEnd)
		? DateTime.fromISO(reservationDateEnd, { zone: TIMEZONE })
		: DateTime.fromJSDate(reservationDateEnd, { zone: TIMEZONE })

	const startTime = startDate.toFormat('HH:mm')
	const endTime = endDate.toFormat('HH:mm')
	const day = startDate.toFormat('dd-MM-yyyy')

	return (
		<div className='flex flex-col w-full max-w-md border border-gray-300 shadow-sm rounded-lg p-4 bg-white dark:bg-gray-900 text-primary-blue h-full'>
			<div className='flex justify-between items-center'>
				<h2 className='text-2xl font-semibold'>{serviceName}</h2>
				<span
					className={`px-3 py-1 text-sm font-medium rounded-full ${
						status === 'confirmed'
							? 'bg-green-100 text-green-700'
							: status === 'canceled'
							? 'bg-red-100 text-red-700'
							: 'bg-yellow-100 text-yellow-700'
					}`}
				>
					{status === 'confirmed'
						? 'Potwierdzone'
						: status === 'canceled'
						? 'Anulowane'
						: 'Oczekujące'}
				</span>
			</div>

			<div className='mt-3 flex flex-col gap-2'>
				<div>
					<p className='text-sm text-gray-500 dark:text-gray-400'>
						Data rezerwacji:
					</p>
					<p className='text-md font-medium'>{`${startTime}-${endTime}, ${day}`}</p>
				</div>

				<div>
					<p className='text-sm text-gray-500 dark:text-gray-400'>
						Dane kontaktowe:
					</p>
					<p className='text-md font-medium'>{contact}</p>
				</div>

				<div>
					<p className='text-sm text-gray-500 dark:text-gray-400'>Adres:</p>
					<p className='text-md font-medium'>{address}</p>
				</div>

				{promoCode && (
					<div>
						<p className='text-sm text-gray-500 dark:text-gray-400'>
							Kod promocyjny:
						</p>
						<p className='text-md font-medium'>{promoCode}</p>
					</div>
				)}

				{additionalInfo && (
					<div>
						<p className='text-sm text-gray-500 dark:text-gray-400'>
							Komentarz:
						</p>
						<p className='text-md font-medium'>{additionalInfo}</p>
					</div>
				)}
			</div>

			{/* 🔹 Кнопки для редактирования/удаления или комментария */}
			<div className='mt-auto flex flex-col space-y-2 pt-3'>
				{past ? (
					<>
						<button
							className='px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600'
							onClick={() => setShowForm(!showForm)}
						>
							{showForm ? 'Anuluj' : 'Zostaw komentarz'}
						</button>

						{showForm && (
							<motion.div
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: 'auto', opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								className='overflow-hidden bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mt-2'
							>
								<form
									onSubmit={handleSubmit(handleSaveComment)}
									className='flex flex-col gap-3'
								>
									<Controller
										name='rating'
										control={control}
										rules={{ required: 'Оцените услугу' }}
										render={({ field }) => (
											<div className='flex gap-2'>
												<Rate
													count={5}
													value={field.value}
													onChange={value => {
														field.onChange(value)
														setValue('rating', value) // Устанавливаем значение в `react-hook-form`
													}}
												/>
												<p className='font-bold'>{field.value}</p>
											</div>
										)}
									/>

									{/* 🔹 Поле для комментария */}
									<Controller
										name='text'
										control={control}
										render={({ field }) => (
											<TextArea {...field} placeholder='Dodaj komentarz...' />
										)}
									/>

									{/* 🔹 Кнопки "Сохранить" и "Отмена" */}
									<div className='flex justify-end gap-2'>
										<button
											type='button'
											className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300'
											onClick={() => setShowForm(false)}
										>
											Anuluj
										</button>
										<button
											type='submit'
											className='px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600'
										>
											Zapisz
										</button>
									</div>
								</form>
							</motion.div>
						)}
					</>
				) : (
					<div className='flex justify-end gap-3'>
						<button
							className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300'
							onClick={onEdit}
						>
							Edytować
						</button>
						<Popover
							content='Na pewno chcesz anulować?'
							confirm
							placement='top'
							autoShift
							onConfirm={handleDelete}
						>
							<button
								disabled={isDeleting}
								className='px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 disabled:opacity-60'
							>
								{isDeleting ? 'Anulowanie...' : 'Anulować'}
							</button>
						</Popover>
					</div>
				)}
			</div>
		</div>
	)
}

export default ReservationCard
