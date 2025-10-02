// components/QuickReservation.jsx
'use client'

import Button from '@/components/ui/button'
import Modal from '@/components/ui/modal'
import Result from '@/components/ui/result'
import { useEffect, useMemo, useState } from 'react'

import { getServices } from '@/actions/service'
import MultiServicePicker from './ui/MultiServicePicker'

const LS_KEY = 'OPX_QR_FORM'

export default function QuickReservation({
	title = 'Szybka rezerwacja',
	dropdownPosition = 'top',
}) {
	const [services, setServices] = useState([])
	const [name, setName] = useState('')
	const [phone, setPhone] = useState('')
	const [serviceIds, setServiceIds] = useState([]) // string[]
	const [open, setOpen] = useState(false)
	const [status, setStatus] = useState(null)
	const [message, setMessage] = useState('')
	const [sending, setSending] = useState(false) // 🔹 новый стейт

	// загрузка прайса
	useEffect(() => {
		;(async () => {
			try {
				const data = await getServices()
				setServices(data?.prices || [])
			} catch (e) {
				console.error('getServices failed', e)
			}
		})()
	}, [])

	// восстановление + ?sid=
	useEffect(() => {
		try {
			const saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
			if (saved.name) setName(saved.name)
			if (saved.phone) setPhone(saved.phone)
			if (Array.isArray(saved.serviceIds))
				setServiceIds(saved.serviceIds.map(String))
			if (saved.serviceId && !saved.serviceIds)
				setServiceIds([String(saved.serviceId)]) // совместимость
		} catch {}
		try {
			const url = new URL(window.location.href)
			const sid = url.searchParams.get('sid')
			if (sid) {
				const id = String(sid)
				setServiceIds(prev => Array.from(new Set([...(prev || []), id])))
				const prev = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
				localStorage.setItem(
					LS_KEY,
					JSON.stringify({
						...prev,
						serviceIds: Array.from(
							new Set([...(prev.serviceIds || []).map(String), id])
						),
					})
				)
			}
		} catch {}
	}, [])

	// автоподстановка из карточек оферты
	useEffect(() => {
		function onSelected(e) {
			const id = String(e?.detail?.serviceId ?? '')
			if (!id) return
			setServiceIds(prev => Array.from(new Set([...(prev || []), id])))
			const prev = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
			localStorage.setItem(
				LS_KEY,
				JSON.stringify({
					...prev,
					serviceIds: Array.from(
						new Set([...(prev.serviceIds || []).map(String), id])
					),
				})
			)
		}
		window.addEventListener('opx:service-selected', onSelected)
		return () => window.removeEventListener('opx:service-selected', onSelected)
	}, [])

	// sync текстовых полей
	useEffect(() => {
		const prev = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
		localStorage.setItem(LS_KEY, JSON.stringify({ ...prev, name }))
	}, [name])
	useEffect(() => {
		const prev = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
		localStorage.setItem(LS_KEY, JSON.stringify({ ...prev, phone }))
	}, [phone])
	useEffect(() => {
		const prev = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
		localStorage.setItem(LS_KEY, JSON.stringify({ ...prev, serviceIds }))
	}, [serviceIds])

	// главный (родительский) ID
	const primaryServiceId = useMemo(() => {
		const parentSet = new Set(services.map(s => String(s.id ?? '')))
		return serviceIds.find(id => parentSet.has(id)) || serviceIds[0] || ''
	}, [serviceIds, services])

	const disabled = !name.trim() || !phone.trim() || !primaryServiceId

	async function submitLead(e) {
		e.preventDefault()
		if (!primaryServiceId || sending) return
		setSending(true) // 🔹 блокируем кнопку

		window.dataLayer = window.dataLayer || []
		window.dataLayer.push({
			event: 'lead_submit',
			lead_source: 'quick_form',
			service_id: primaryServiceId,
		})

		const idToName = new Map(services.map(s => [String(s.id), s.name]))
		services.forEach(s => {
			;(s.additionalServices || []).forEach(sub => {
				idToName.set(String(sub.id), sub.name)
			})
		})
		const selectedServiceNames = (serviceIds || [])
			.map(id => idToName.get(String(id)))
			.filter(Boolean)

		try {
			const res = await fetch('/api/leads', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				cache: 'no-store',
				body: JSON.stringify({
					name,
					phone,
					serviceId: primaryServiceId,
					serviceName:
						services.find(s => String(s.id) === primaryServiceId)?.name || '',
					selectedServiceIds: serviceIds,
					selectedServiceNames,
				}),
			})
			const json = await res.json()
			if (!res.ok || !json?.ok)
				throw new Error(json?.error || `HTTP ${res.status}`)

			setStatus('success')
			setMessage('Zgłoszenie przyjęte. Wkrótce do Ciebie oddzwonimy.')
			setOpen(true)

			setName('')
			setPhone('')
			const prev = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
			localStorage.setItem(
				LS_KEY,
				JSON.stringify({ ...prev, name: '', phone: '' })
			)

			window.dataLayer.push({
				event: 'lead_success',
				lead_source: 'quick_form',
				service_id: json?.lead?.serviceId || primaryServiceId,
				partner_code: json?.lead?.partnerCode || null,
			})
		} catch (err) {
			console.error('lead submit failed:', err)
			setStatus('error')
			setMessage('Nie udało się wysłać zgłoszenia. Spróbuj ponownie.')
			setOpen(true)
			window.dataLayer.push({
				event: 'lead_error',
				lead_source: 'quick_form',
				service_id: primaryServiceId,
				error_message: String(err?.message || err),
			})
		} finally {
			setSending(false) // 🔹 разблокируем кнопку
		}
	}

	return (
		<section
			id='reservation'
			className='container-padding py-10 lg:py-16 relative z-[200] isolation-isolate'
		>
			<h2 className='title text-white mb-6'>{title}</h2>

			<form
				onSubmit={submitLead}
				className='
          grid gap-4 sm:gap-5 lg:gap-6
          sm:grid-cols-2 lg:grid-cols-4
          rounded-3xl border border-white/20 bg-white/5 backdrop-blur-sm
          p-4 sm:p-5 lg:p-6
        '
			>
				{/* Imię */}
				<div className='sm:col-span-1'>
					<label className='block text-white/85 text-sm mb-1'>Imię</label>
					<input
						type='text'
						value={name}
						onChange={e => setName(e.target.value)}
						placeholder='Twoje imię'
						className='w-full h-[48px] md:h-[52px] rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/40'
					/>
				</div>

				{/* Telefon */}
				<div className='sm:col-span-1'>
					<label className='block text-white/85 text-sm mb-1'>Telefon</label>
					<input
						type='tel'
						inputMode='tel'
						value={phone}
						onChange={e => setPhone(e.target.value)}
						placeholder='+48 123 456 789'
						className='w-full h-[48px] md:h-[52px] rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/40'
					/>
				</div>

				{/* Usługa */}
				<div className='sm:col-span-1'>
					<MultiServicePicker
						services={services}
						value={serviceIds}
						onChange={setServiceIds}
						placeholder='Wybierz usługę…'
						label='Usługa'
						dropdownPosition={dropdownPosition}
					/>
				</div>

				{/* CTA */}
				<div className='sm:col-span-1 flex items-end'>
					<Button
						type='submit'
						disabled={disabled || sending}
						className='w-full p-4 sm:p-5 lg:px-2 bg-white text-primary-blue hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed'
						aria-label='Wyślij zgłoszenie'
					>
						{sending ? 'Wysyłanie…' : 'Wyślij zgłoszenie'}
					</Button>
				</div>
			</form>

			<Modal visible={open} onClose={() => setOpen(false)}>
				<Result
					status={status}
					title={status === 'success' ? 'Sukces!' : 'Błąd'}
					subTitle={message}
				/>
			</Modal>
		</section>
	)
}
