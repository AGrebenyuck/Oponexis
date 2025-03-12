'use client'

import {
	getFutureReservations,
	getPastReservations,
	updateReservation,
} from '@/actions/booking'
import AutoComplete from '@/components/ui/autoComplete'
import Drawer from '@/components/ui/drawer'
import Segmented from '@/components/ui/segmented'
import { useEffect, useState } from 'react'
import EditReservationForm from './_components/editReservationForm'
import ReservationCard from './_components/reservationCard'

const EventsPage = () => {
	const [viewMode, setViewMode] = useState('future') // future | past
	const [reservations, setReservations] = useState([])
	const [filteredReservations, setFilteredReservations] = useState([])
	const [searchQuery, setSearchQuery] = useState('') // Фильтр по контакту
	const [selectedReservation, setSelectedReservation] = useState(null)
	const [isEditing, setIsEditing] = useState(false)

	const handleSave = async updatedData => {
		try {
			console.log(updatedData)

			const result = await updateReservation(updatedData)

			if (result.success) {
				console.log(result.updatedReservation)

				// Обновляем локальное состояние без перезагрузки страницы
				setReservations(prev =>
					prev.map(r =>
						r.id === updatedData.id ? result.updatedReservation : r
					)
				)
				setFilteredReservations(prev =>
					prev.map(r =>
						r.id === updatedData.id ? result.updatedReservation : r
					)
				)

				// Закрываем форму редактирования
				setIsEditing(false)
				setSelectedReservation(null)
			} else {
				console.error('Ошибка обновления:', result.error)
			}
		} catch (error) {
			console.error('Ошибка при обновлении бронирования:', error)
		}
	}

	// Загружаем данные при переключении
	useEffect(() => {
		const fetchReservations = async () => {
			const data =
				viewMode === 'future'
					? await getFutureReservations()
					: await getPastReservations()

			setReservations(data.reservations)
			setFilteredReservations(data.reservations)
		}
		fetchReservations()
	}, [viewMode])

	// Фильтрация по контактам
	useEffect(() => {
		if (!searchQuery) {
			setFilteredReservations(reservations) // Если поле пустое, показываем все бронирования
		} else {
			const lowerQuery = searchQuery.toLowerCase()
			const filtered = reservations.filter(({ contactInfo }) =>
				contactInfo.toLowerCase().includes(lowerQuery)
			)
			setFilteredReservations(filtered)
		}
	}, [searchQuery, reservations])

	return (
		<div className='p-4'>
			{/* Фильтрация и управление */}
			<div className='flex gap-4 items-center mb-4'>
				<Segmented
					options={['future', 'past']}
					defaultValue='future'
					onChange={setViewMode}
				/>
				<AutoComplete
					options={[...new Set(reservations.map(r => r.contactInfo))]} // Убираем дубли
					onSelect={setSearchQuery}
					onClear={() => setSearchQuery('')} // 🔹 Сброс фильтра при очистке
					placeholder='Фильтр по контакту...'
				/>
			</div>

			{/* Список резерваций */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				{filteredReservations ? (
					filteredReservations?.map(reservation => (
						<ReservationCard
							key={reservation.id}
							{...reservation}
							showActions={viewMode === 'future'} // Показываем кнопки только для будущих резерваций
							onEdit={() => {
								setSelectedReservation(reservation)
								setIsEditing(true)
							}}
							onDelete={() => handleDelete(reservation.id)}
						/>
					))
				) : (
					<p>Loading...</p>
				)}
			</div>

			{/* Drawer для редактирования */}
			{isEditing && (
				<Drawer
					visible={isEditing}
					onClose={() => setIsEditing(false)}
					title='Редактирование резервации'
					width='max-w-[500px]'
				>
					<EditReservationForm
						initialData={selectedReservation}
						onSave={handleSave}
					/>
				</Drawer>
			)}
		</div>
	)
}

export default EventsPage
