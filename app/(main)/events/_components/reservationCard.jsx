import { DateTime } from 'luxon'

const ReservationCard = ({
	serviceName,
	startTime: reservationDateStart,
	endTime: reservationDateEnd,
	contactInfo: contact,
	address,
	promoCode,
	comment,
	status = 'pending',
	showActions = true, // 🔹 Теперь кнопки могут быть скрыты
	onEdit,
	onDelete,
}) => {
	const isISODate = date => typeof date === 'string' && !isNaN(Date.parse(date))
	const isJSDate = date => date instanceof Date && !isNaN(date.getTime())

	const TIMEZONE = 'Europe/Warsaw'

	// Проверяем reservationDateStart
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
						? 'Подтверждено'
						: status === 'canceled'
						? 'Отменено'
						: 'Ожидает'}
				</span>
			</div>

			<div className='mt-3 flex flex-col gap-2'>
				<div>
					<p className='text-sm text-gray-500 dark:text-gray-400'>
						Дата резервации:
					</p>
					<p className='text-md font-medium'>{`${startTime}-${endTime}, ${day}`}</p>
				</div>

				<div>
					<p className='text-sm text-gray-500 dark:text-gray-400'>
						Контактные данные:
					</p>
					<p className='text-md font-medium'>{contact}</p>
				</div>

				<div>
					<p className='text-sm text-gray-500 dark:text-gray-400'>Адрес:</p>
					<p className='text-md font-medium'>{address}</p>
				</div>

				{promoCode && (
					<div>
						<p className='text-sm text-gray-500 dark:text-gray-400'>
							Промокод:
						</p>
						<p className='text-md font-medium'>{promoCode}</p>
					</div>
				)}

				{comment && (
					<div>
						<p className='text-sm text-gray-500 dark:text-gray-400'>
							Комментарий:
						</p>
						<p className='text-md font-medium'>{comment}</p>
					</div>
				)}
			</div>

			{/* 🔹 Кнопки редактирования/удаления только для будущих резерваций */}
			{showActions && (
				<div className='mt-auto flex justify-end space-x-2'>
					<button
						className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
						onClick={onEdit}
					>
						Редактировать
					</button>
					<button
						className='px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600'
						onClick={onDelete}
					>
						Отменить
					</button>
				</div>
			)}
		</div>
	)
}

export default ReservationCard
