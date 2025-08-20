'use client'

import {
	deleteReservation,
	getFutureReservations,
	getPastReservations,
	updateReservation,
} from '@/actions/booking'
import AutoComplete from '@/components/ui/autoComplete'
import Divider from '@/components/ui/divider'
import Drawer from '@/components/ui/drawer'
import message from '@/components/ui/message'
import Segmented from '@/components/ui/segmented'
import Spin from '@/components/ui/spin'
import { DateTime } from 'luxon'
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
	const [isLoading, setIsLoading] = useState(true)

	const handleSave = async updatedData => {
		const TIMEZONE = 'Europe/Warsaw'
		const date = updatedData.date
		const time = updatedData.time

		const start = DateTime.fromISO(`${date}T${time}`, {
			zone: TIMEZONE,
		})
		const end = start.plus({ minutes: updatedData.duration })

		updatedData.startTime = start.toISO()
		updatedData.endTime = end.toISO()

		try {
			const result = await updateReservation(updatedData)

			if (result.success) {
				message.success('Rezerwacja została zaktualizowana')
				result.updatedReservation.startTime = new Date(
					result.updatedReservation.startTime
				)
				result.updatedReservation.endTime = new Date(
					result.updatedReservation.endTime
				)

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
				message.error('Błąd: ' + result.error)
			}
		} catch (error) {
			console.error('Ошибка при обновлении бронирования:', error)
			message.error('Błąd podczas aktualizacji rezerwacji: ' + error)
		}
	}

	const handleDelete = async id => {
		try {
			const result = await deleteReservation(id)

			if (result.success) {
				// Aktualizujemy lokalny stan, usuwając rezerwację
				setReservations(prev => prev.filter(r => r.id !== id.reservationId))
				setFilteredReservations(prev =>
					prev.filter(r => r.id !== id.reservationId)
				)
				message.success('Rezerwacja zrezygnowana')
			} else {
				message.error(result.error)
				console.error('Błąd podczas usuwania:', result.error)
			}
		} catch (error) {
			console.error('Błąd podczas usuwania rezerwacji:', error)
		}
	}

	// Загружаем данные при переключении
	useEffect(() => {
		const fetchReservations = async () => {
			setIsLoading(true)
			const data =
				viewMode === 'future'
					? await getFutureReservations()
					: await getPastReservations()

			setReservations(data.reservations)
			setFilteredReservations(data.reservations)
			setIsLoading(false)
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

			<Divider />

			{/* Список резерваций */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 '>
				{isLoading ? (
					<div className='col-span-full flex justify-center py-12'>
						<Spin size='large' />
					</div>
				) : filteredReservations.length > 0 ? (
					filteredReservations.map(reservation => (
						<ReservationCard
							key={reservation.id}
							{...reservation}
							showActions={viewMode === 'future'}
							onEdit={() => {
								setSelectedReservation(reservation)
								setIsEditing(true)
							}}
							onDelete={() =>
								handleDelete({
									reservationId: reservation.id,
									zadarmaDealId: reservation.zadarmaDealId,
									zadarmaTaskId: reservation.zadarmaTaskId,
								})
							}
							past={viewMode === 'past'}
						/>
					))
				) : (
					<p className='col-span-full text-center'>Brak rezerwacji</p>
				)}
			</div>

			{/* Drawer для редактирования */}
			{isEditing && (
				<Drawer
					visible={isEditing}
					onClose={() => setIsEditing(false)}
					title='Edycja rezerwacji'
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
