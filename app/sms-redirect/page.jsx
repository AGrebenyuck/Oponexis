'use client'

import { crmFetch } from '@/lib/crm'
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

	function normalizeVisitTime(value) {
		const raw = String(value || '').trim()
		const match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
		if (!match) return ''

		const hours = Number(match[1])
		const minutes = Number(match[2])
		if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return ''

		return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
	}

	function buildOrderUrl(normalizedVisitTime) {
		const base = getBaseUrl()
		const url = new URL('/order', base)
		const [visitHour, visitMinute] = normalizedVisitTime.split(':')

		if (lead) url.searchParams.set('lead', lead)
		if (name) url.searchParams.set('name', name)
		if (phone) url.searchParams.set('phone', phone)
		if (service) url.searchParams.set('service', service)
		if (visitDate) url.searchParams.set('visitDate', visitDate)
		if (normalizedVisitTime) {
			url.searchParams.set('visitTime', normalizedVisitTime)
			url.searchParams.set('visitHour', visitHour)
			url.searchParams.set('visitMinute', visitMinute)
		}

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
			href = `sms:${cleanedPhone}&body=${encodedBody}`
		} else if (isAndroid) {
			href = `smsto:${cleanedPhone}?body=${encodedBody}`
		} else {
			href = `sms:${cleanedPhone}?body=${encodedBody}`
		}

		window.location.href = href
	}

	async function handleSendSms() {
		setError('')

		if (!visitDate || !visitTime) {
			setError('Wybierz datę i godzinę wizyty.')
			return
		}

		const normalizedVisitTime = normalizeVisitTime(visitTime)
		if (!normalizedVisitTime) {
			setError('Podaj pełną godzinę wizyty w formacie HH:MM.')
			return
		}

		const orderUrl = buildOrderUrl(normalizedVisitTime)
		const dateStr = formatDateForSms()
		const terminLine = `Termin wizyty: ${dateStr}, ${normalizedVisitTime}`

		const smsText =
			`Cześć${name ? ' ' + name : ''}! Tu mobilny serwis Oponexis.\n\n` +
			`${terminLine}\n\n` +
			`Aby potwierdzić wizytę i ułatwić dojazd, prosimy o uzupełnienie kilku danych ` +
			`(adres, kolor auta, nr rejestracyjny).\n\n` +
			`Formularz: ${orderUrl}`

		// 🔹 ЛОГИРУЕМ факт отправки СМС с датой визита
		try {
			await crmFetch('/api/public/sms/track-sent', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					phone,
					name,
					service,
					leadId: lead || null,
					source: lead ? 'lead' : 'manual',
					visitDate, // ← "YYYY-MM-DD"
					visitTime: normalizedVisitTime, // ← "HH:MM"
				}),
			})
		} catch (e) {
			console.error('sms/track-sent failed', e)
			// не ломаем UX, просто логируем
		}

		// 🔹 Открываем нативное приложение SMS
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
					<div className='space-y-1'>
						<label className='text-xs text-slate-300 block'>Data wizyty</label>
						<input
							type='date'
							value={visitDate}
							onChange={e => setVisitDate(e.target.value)}
							className='w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100'
						/>
					</div>

					<div className='space-y-1'>
						<label className='text-xs text-slate-300 block'>
							Godzina wizyty
						</label>
						<input
							type='time'
							step='60'
							value={visitTime}
							onChange={e => setVisitTime(normalizeVisitTime(e.target.value) || e.target.value)}
							className='w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-orange-400'
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
