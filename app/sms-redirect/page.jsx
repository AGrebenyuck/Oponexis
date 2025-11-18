'use client'

import { getBaseUrl } from '@/lib/getBaseUrl'
import { use, useEffect, useState } from 'react'

export default function SmsRedirectPage(props) {
	// searchParams как async-объект (Next App Router)
	const searchParams = use(props.searchParams)

	const lead = searchParams?.lead || ''
	const name = searchParams?.name || ''
	const phone = searchParams?.phone || ''
	const service = searchParams?.service || ''

	const [visitDate, setVisitDate] = useState('')
	const [visitTime, setVisitTime] = useState('')
	const [error, setError] = useState('')

	// по умолчанию — сегодняшняя дата + текущее время
	useEffect(() => {
		const now = new Date()

		const yyyy = now.getFullYear()
		const mm = String(now.getMonth() + 1).padStart(2, '0')
		const dd = String(now.getDate()).padStart(2, '0')
		setVisitDate(`${yyyy}-${mm}-${dd}`)

		const hh = String(now.getHours()).padStart(2, '0')
		const min = String(now.getMinutes()).padStart(2, '0')
		setVisitTime(`${hh}:${min}`)
	}, [])

	if (!phone) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 px-6'>
				<div className='max-w-md text-center'>
					<h1 className='text-lg font-semibold mb-2'>Brak numeru telefonu</h1>
					<p className='text-slate-400 text-sm'>
						Link SMS wymaga parametru <code>phone</code>.
					</p>
				</div>
			</div>
		)
	}

	function buildOrderUrl() {
		const base = getBaseUrl()
		const url = new URL('/order', base)

		if (lead) url.searchParams.set('lead', lead)
		if (name) url.searchParams.set('name', name)
		if (phone) url.searchParams.set('phone', phone)
		if (service) url.searchParams.set('service', service)
		if (visitDate) url.searchParams.set('visitDate', visitDate)
		if (visitTime) url.searchParams.set('visitTime', visitTime)

		return url.toString()
	}

	function formatDateForSms() {
		if (!visitDate) return ''
		const [y, m, d] = visitDate.split('-')
		return `${d}.${m}.${y}`
	}

	// 👉 единая функция, которая открывает SMS по-разному для iOS/Android
	function openSmsLink(phoneNumber, smsText) {
		if (typeof window === 'undefined') return

		// оставляем только + и цифры, без пробелов, скобок и т.д.
		const cleanedPhone = String(phoneNumber).replace(/[^\d+]/g, '')
		const encodedBody = encodeURIComponent(smsText)

		const ua = navigator.userAgent || ''
		const isIOS = /iPhone|iPad|iPod/i.test(ua)
		const isAndroid = /Android/i.test(ua)

		let href = ''

		if (isIOS) {
			// iOS хорошо переваривает sms: + &body=
			// пример: sms:+48111111111&body=...
			href = `sms:${cleanedPhone}&body=${encodedBody}`
		} else if (isAndroid) {
			// Android-специфичная схема smsto:
			// ВАЖНО: без // — только smsto:+48...?
			// пример: smsto:+48111111111?body=...
			href = `smsto:${cleanedPhone}?body=${encodedBody}`
		} else {
			// fallback для других платформ — пробуем sms:
			href = `sms:${cleanedPhone}?body=${encodedBody}`
		}

		window.location.href = href
	}

	function handleSendSms() {
		setError('')

		if (!visitDate || !visitTime) {
			setError('Wybierz datę i godzinę wizyty.')
			return
		}

		const orderUrl = buildOrderUrl()
		const dateStr = formatDateForSms()
		const terminLine = `Termin wizyty: ${dateStr}, ${visitTime}`

		const smsText =
			`Cześć${name ? ' ' + name : ''}! Tu mobilny serwis Oponexis.\n\n` +
			`${terminLine}\n\n` +
			`Aby potwierdzić wizytę i ułatwić dojazd, prosimy o uzupełnienie kilku danych ` +
			`(adres, kolor auta, nr rejestracyjny).\n\n` +
			`Formularz: ${orderUrl}`

		openSmsLink(phone, smsText)
	}

	return (
		<div className='min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 px-6'>
			<div className='w-full max-w-md bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl'>
				<h1 className='text-lg font-semibold mb-2'>Ustal termin wizyty</h1>
				<p className='text-slate-400 text-sm mb-4'>
					Wybierz datę i godzinę, a następnie wyślemy gotową wiadomość SMS do
					klienta z linkiem do formularza.
				</p>

				<div className='space-y-4 mb-4'>
					{/* Data wizyty */}
					<div className='space-y-1'>
						<label className='text-xs text-slate-300 block'>Data wizyty</label>
						<input
							type='date'
							value={visitDate}
							onChange={e => setVisitDate(e.target.value)}
							className='w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100'
						/>
					</div>

					{/* Godzina wizyty */}
					<div className='space-y-1'>
						<label className='text-xs text-slate-300 block'>
							Godzina wizyty
						</label>
						<input
							type='time'
							value={visitTime}
							onChange={e => setVisitTime(e.target.value)}
							className={`
								w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm
								text-slate-100
								focus:outline-none focus:ring-1 focus:ring-orange-400
							`}
						/>
					</div>

					{error && <p className='text-xs text-red-400'>{error}</p>}
				</div>

				<button
					onClick={handleSendSms}
					className='w-full inline-flex items-center justify-center rounded-lg bg-orange-500 hover:bg-orange-600 text-sm font-medium py-2.5'
				>
					Wyślij SMS z potwierdzeniem
				</button>
			</div>
		</div>
	)
}
