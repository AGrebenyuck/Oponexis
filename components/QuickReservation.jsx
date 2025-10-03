// components/QuickReservation.jsx
'use client'

import { getServices } from '@/actions/service'
import Button from '@/components/ui/button'
import Modal from '@/components/ui/modal'
import Result from '@/components/ui/result'
import { useEffect, useMemo, useRef, useState } from 'react'
import MultiServicePicker from './ui/MultiServicePicker'

const LS_KEY = 'OPX_QR_FORM'

// ── helpers ────────────────────────────────────────────────────────────────
function validateName(raw) {
	const name = (raw || '').trim()
	if (!name) return 'Imię jest wymagane'
	if (name.length < 2) return 'Imię powinno mieć min. 2 znaki'
	if (name.length > 50) return 'Imię nie powinno przekraczać 50 znaków'
	if (!/^[A-Za-zÀ-žżźćńółęąśŻŹĆĄŚĘŁÓŃ' -]+$/.test(name))
		return 'Użyj tylko liter, spacji i myślnika'
	return null
}
function normalizePhonePL(raw) {
	const s = String(raw || '').replace(/[^\d+]/g, '')
	if (s.startsWith('+48')) {
		const d = s.replace(/[^\d]/g, '')
		const n = d.slice(2)
		return n.length === 9 ? `+48${n}` : null
	} else if (s.startsWith('48')) {
		const d = s.replace(/[^\d]/g, '')
		const n = d.slice(2)
		return n.length === 9 ? `+48${n}` : null
	} else {
		const d = s.replace(/[^\d]/g, '')
		return d.length === 9 ? `+48${d}` : null
	}
}
function validatePhoneSoft(raw) {
	// miękka walidacja do live-feedback (bez normalizacji)
	const digits = String(raw || '').replace(/\D/g, '')
	if (!digits) return 'Telefon jest wymagany'
	if (digits.startsWith('48')) {
		if (digits.length < 11) return 'Uzupełnij numer w formacie 48 + 9 cyfr'
	} else if (digits.startsWith('0048')) {
		if (digits.length < 13) return 'Uzupełnij numer PL'
	} else if (digits.length < 9) {
		return 'Podaj min. 9 cyfr'
	}
	return null
}

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
	const [sending, setSending] = useState(false)

	// touched + errors
	const [touchedName, setTouchedName] = useState(false)
	const [touchedPhone, setTouchedPhone] = useState(false)
	const [touchedService, setTouchedService] = useState(false)
	const [nameErr, setNameErr] = useState(null)
	const [phoneErr, setPhoneErr] = useState(null)
	const [serviceErr, setServiceErr] = useState(null)

	// refs (фокус на первом ошибочном)
	const nameRef = useRef(null)
	const phoneRef = useRef(null)

	// debounce таймеры
	const nameTimer = useRef(null)
	const phoneTimer = useRef(null)

	// форс-перемонт мультиселекта для чистого визуального reset
	const [formVersion, setFormVersion] = useState(0)

	// ── загрузка прайса
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

	// ── восстановление + ?sid=
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

	// ── автоподстановка из карточек оферты
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
			setTouchedService(true)
		}
		window.addEventListener('opx:service-selected', onSelected)
		return () => window.removeEventListener('opx:service-selected', onSelected)
	}, [])

	// ── sync в LS
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

	// ── родительский id
	const primaryServiceId = useMemo(() => {
		const parentSet = new Set(services.map(s => String(s.id ?? '')))
		return serviceIds.find(id => parentSet.has(id)) || serviceIds[0] || ''
	}, [serviceIds, services])

	// ── live-валидация (после взаимодействия) с debounce
	useEffect(() => {
		if (!touchedName) return
		clearTimeout(nameTimer.current)
		nameTimer.current = setTimeout(() => {
			setNameErr(validateName(name))
		}, 250)
		return () => clearTimeout(nameTimer.current)
	}, [name, touchedName])

	useEffect(() => {
		if (!touchedPhone) return
		clearTimeout(phoneTimer.current)
		phoneTimer.current = setTimeout(() => {
			setPhoneErr(validatePhoneSoft(phone))
		}, 250)
		return () => clearTimeout(phoneTimer.current)
	}, [phone, touchedPhone])

	useEffect(() => {
		if (!touchedService) return
		setServiceErr(primaryServiceId ? null : 'Wybierz co najmniej jedną usługę')
	}, [primaryServiceId, touchedService])

	// ── полный сброс формы
	function resetForm() {
		setName('')
		setPhone('')
		setServiceIds([])

		setTouchedName(false)
		setTouchedPhone(false)
		setTouchedService(false)
		setNameErr(null)
		setPhoneErr(null)
		setServiceErr(null)

		try {
			const prev = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
			localStorage.setItem(
				LS_KEY,
				JSON.stringify({ ...prev, name: '', phone: '', serviceIds: [] })
			)
		} catch {}

		setFormVersion(v => v + 1) // визуально обнуляем MultiServicePicker
	}

	// ── submit
	async function submitLead(e) {
		e.preventDefault()

		setTouchedName(true)
		setTouchedPhone(true)
		setTouchedService(true)

		const _nameErr = validateName(name)
		const normalizedPhone = normalizePhonePL(phone)
		const _phoneErr = normalizedPhone
			? null
			: 'Podaj poprawny numer PL (np. +48 123 456 789)'
		const _serviceErr = primaryServiceId
			? null
			: 'Wybierz co najmniej jedną usługę'

		setNameErr(_nameErr)
		setPhoneErr(_phoneErr)
		setServiceErr(_serviceErr)

		if (_nameErr || _phoneErr || _serviceErr || sending) {
			if (_nameErr && nameRef.current) nameRef.current.focus()
			else if (_phoneErr && phoneRef.current) phoneRef.current.focus()
			return
		}

		setSending(true)

		window.dataLayer = window.dataLayer || []
		window.dataLayer.push({
			event: 'lead_submit',
			lead_source: 'quick_form',
			service_id: primaryServiceId,
		})

		// имена выбранных (для уведомлений/аналитики)
		const idToName = new Map(services.map(s => [String(s.id), s.name]))
		services.forEach(s =>
			(s.additionalServices || []).forEach(sub => {
				idToName.set(String(sub.id), sub.name)
			})
		)
		const selectedServiceNames = (serviceIds || [])
			.map(id => idToName.get(String(id)))
			.filter(Boolean)

		try {
			const res = await fetch('/api/leads', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				cache: 'no-store',
				body: JSON.stringify({
					name: name.trim(),
					phone: normalizedPhone,
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

			// полный reset
			resetForm()

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
			setSending(false)
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
						ref={nameRef}
						type='text'
						value={name}
						onChange={e => setName(e.target.value)}
						onBlur={() => setTouchedName(true)}
						placeholder='Twoje imię'
						className={`w-full h-[48px] md:h-[52px] rounded-xl bg-white/10 text-white placeholder-white/50 border px-3 py-2 focus:outline-none focus:ring-2 ${
							touchedName && nameErr
								? 'border-red-400 focus:ring-red-400'
								: 'border-white/30 focus:ring-white/40'
						}`}
						minLength={2}
						maxLength={50}
						aria-invalid={!!(touchedName && nameErr)}
						aria-describedby='name-err'
					/>
					{touchedName && nameErr && (
						<p id='name-err' className='mt-1 text-xs text-red-300'>
							{nameErr}
						</p>
					)}
				</div>

				{/* Telefon */}
				<div className='sm:col-span-1'>
					<label className='block text-white/85 text-sm mb-1'>Telefon</label>
					<input
						ref={phoneRef}
						type='tel'
						inputMode='tel'
						value={phone}
						onChange={e => setPhone(e.target.value)}
						onBlur={() => setTouchedPhone(true)}
						placeholder='+48 123 456 789'
						className={`w-full h-[48px] md:h-[52px] rounded-xl bg-white/10 text-white placeholder-white/50 border px-3 py-2 focus:outline-none focus:ring-2 ${
							touchedPhone && phoneErr
								? 'border-red-400 focus:ring-red-400'
								: 'border-white/30 focus:ring-white/40'
						}`}
						aria-invalid={!!(touchedPhone && phoneErr)}
						aria-describedby='phone-err'
					/>
					{touchedPhone && phoneErr && (
						<p id='phone-err' className='mt-1 text-xs text-red-300'>
							{phoneErr}
						</p>
					)}
				</div>

				{/* Usługa (мультиселект) */}
				<div className='sm:col-span-1'>
					<MultiServicePicker
						key={formVersion} // ⬅️ форс-reset визуального состояния
						services={services}
						value={serviceIds}
						onChange={v => {
							setServiceIds(v)
							setTouchedService(true)
						}}
						placeholder='Wybierz usługę…'
						label='Usługa'
						dropdownPosition={dropdownPosition}
						aria-invalid={!!(touchedService && serviceErr)}
					/>
					{touchedService && serviceErr && (
						<p className='mt-1 text-xs text-red-300'>{serviceErr}</p>
					)}
				</div>

				{/* CTA */}
				<div className='sm:col-span-1 flex items-end'>
					<Button
						type='submit'
						disabled={sending}
						className='w-full p-4 sm:p-5 lg:px-2 bg-white text-primary-blue hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed'
						aria-label='Wyślij zgłoszenie'
					>
						{sending ? 'Wysyłanie…' : 'Wyślij zgłoszenie'}
					</Button>
				</div>
			</form>

			<Modal
				visible={open}
				onClose={() => {
					setOpen(false)
					// при закрытии ничего не сбрасываем — reset уже сделан на success
				}}
			>
				<Result
					status={status}
					title={status === 'success' ? 'Sukces!' : 'Błąd'}
					subTitle={message}
				/>
			</Modal>
		</section>
	)
}
