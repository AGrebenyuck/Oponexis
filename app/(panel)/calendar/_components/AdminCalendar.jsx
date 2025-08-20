'use client'

import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import { DateTime } from 'luxon'
import { useEffect, useState } from 'react'

import { getBooking } from '@/actions/booking'
import PushSubscribeButton from '@/components/PushSubscribeButton'
import Modal from '@/components/ui/modal'

export default function AdminCalendar() {
	const [events, setEvents] = useState([])
	const [selectedEvent, setSelectedEvent] = useState(null)
	const [modalVisible, setModalVisible] = useState(false)
	const [reservationDetails, setReservationDetails] = useState(null)

	useEffect(() => {
		async function loadEvents() {
			const bookingsByDate = await getBooking()

			const formattedEvents = []

			for (const [date, slots] of Object.entries(bookingsByDate)) {
				slots.forEach((slot, i) => {
					const start = DateTime.fromISO(`${date}T${slot.start}`).toISO()
					const end = DateTime.fromISO(`${date}T${slot.end}`).toISO()

					formattedEvents.push({
						id: `${date}-${i}`,
						title: 'Rezerwacja',
						start,
						end,
						extendedProps: {
							startRaw: slot.start,
							endRaw: slot.end,
							dateRaw: date,
						},
					})
				})
			}

			setEvents(formattedEvents)
		}

		loadEvents()
	}, [])

	const handleEventClick = async info => {
		const { startRaw, endRaw, dateRaw } = info.event.extendedProps
		const start = DateTime.fromISO(`${dateRaw}T${startRaw}`).toISO()
		const end = DateTime.fromISO(`${dateRaw}T${endRaw}`).toISO()

		try {
			const res = await fetch(
				`/api/reservation/by-slot?start=${encodeURIComponent(
					start
				)}&end=${encodeURIComponent(end)}`
			)
			const json = await res.json()

			if (json.success) {
				setReservationDetails(json.data)
				setModalVisible(true)
			} else {
				console.error('Reservation not found')
			}
		} catch (err) {
			console.error('Error loading reservation:', err)
		}
	}

	return (
		<div className='max-w-7xl mx-auto px-4 py-8 space-y-6'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-bold'>Kalendarz zadań</h1>
				<PushSubscribeButton />
			</div>
			<FullCalendar
				plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
				initialView='dayGridMonth'
				locale='pl'
				events={events}
				height='auto'
				headerToolbar={{
					left: 'prev,next today',
					center: 'title',
					right: 'dayGridMonth,timeGridWeek,timeGridDay',
				}}
				slotMinTime='00:00:00'
				slotMaxTime='24:00:00'
				allDaySlot={false}
				eventClick={handleEventClick}
			/>
			<Modal visible={modalVisible} onClose={() => setModalVisible(false)}>
				{reservationDetails ? (
					<div className='space-y-3 text-primary-blue'>
						<h2 className='text-xl font-bold'>Szczegóły rezerwacji</h2>
						<p>
							<strong>Imię:</strong> {reservationDetails.user.name}
						</p>
						<p>
							<strong>Telefon:</strong> {reservationDetails.contactInfo}
						</p>
						<p>
							<strong>Adres:</strong> {reservationDetails.address}
						</p>
						<p>
							<strong>Usługi:</strong>{' '}
							{reservationDetails.services.map(s => s.service.name).join(', ')}
						</p>
						<p>
							<strong>Komentarz:</strong>{' '}
							{reservationDetails.additionalInfo || 'Brak'}
						</p>
						<p>
							<strong>Czas:</strong>{' '}
							{DateTime.fromISO(reservationDetails.startTime).toFormat(
								'dd-MM-yyyy HH:mm'
							)}{' '}
							- {DateTime.fromISO(reservationDetails.endTime).toFormat('HH:mm')}
						</p>
						<p>
							<strong>Cena:</strong> {reservationDetails.price} zł
						</p>
					</div>
				) : (
					<p>Ładowanie...</p>
				)}
			</Modal>
		</div>
	)
}
