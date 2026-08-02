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
	const [sendChoiceOpen, setSendChoiceOpen] = useState(false)
	const [preparedSms, setPreparedSms] = useState(null)
	const [autoState, setAutoState] = useState({ status: 'idle', message: '' })
	const [gateProfile, setGateProfile] = useState(null)
	const [automaticSmsText, setAutomaticSmsText] = useState('')
	const [previewState, setPreviewState] = useState({ status: 'idle', knownCustomer: null })

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

	useEffect(() => {
		if (!sendChoiceOpen) return

		let cancelled = false

		async function loadGateProfile() {
			try {
				const res = await crmFetch('/api/public/sms/gate-profile', {
					cache: 'no-store',
				})
				const json = await res.json()
				if (!cancelled) setGateProfile(json?.data || null)
			} catch (profileError) {
				console.error('sms/gate-profile failed', profileError)
				if (!cancelled) setGateProfile(null)
			}
		}

		async function loadSmsPreview() {
			if (!preparedSms) return
			setPreviewState({ status: 'loading', knownCustomer: null })
			try {
				const res = await crmFetch('/api/public/sms/preview-form-link', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						phone,
						name,
						service,
						leadId: lead || null,
						visitDate: preparedSms.visitDate,
						visitTime: preparedSms.visitTime,
					}),
				})
				const json = await res.json()
				if (!res.ok || !json?.ok) throw new Error(json?.error || 'Nie udało się przygotować podglądu SMS.')
				if (!cancelled) {
					setAutomaticSmsText(json.text || '')
					setPreviewState({ status: 'ready', knownCustomer: Boolean(json.knownCustomer) })
				}
			} catch (previewError) {
				console.error('sms/preview-form-link failed', previewError)
				if (!cancelled) setPreviewState({ status: 'error', knownCustomer: null })
			}
		}

		loadGateProfile()
		loadSmsPreview()

		return () => {
			cancelled = true
		}
	}, [sendChoiceOpen, preparedSms, phone, name, service, lead])

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

	function prepareSms() {
		setError('')

		if (!visitDate || !visitTime) {
			setError('Wybierz datę i godzinę wizyty.')
			return null
		}

		const normalizedVisitTime = normalizeVisitTime(visitTime)
		if (!normalizedVisitTime) {
			setError('Podaj pełną godzinę wizyty w formacie HH:MM.')
			return null
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

		return {
			orderUrl,
			smsText,
			visitDate,
			visitTime: normalizedVisitTime,
		}
	}

	async function trackManualSms(payload) {
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
					visitDate: payload.visitDate,
					visitTime: payload.visitTime,
				}),
			})
		} catch (e) {
			console.error('sms/track-sent failed', e)
		}
	}

	function handleSendSms() {
		const payload = prepareSms()
		if (!payload) return

		setPreparedSms(payload)
		setAutomaticSmsText(payload.smsText)
		setPreviewState({ status: 'idle', knownCustomer: null })
		setAutoState({ status: 'idle', message: '' })
		setGateProfile(null)
		setSendChoiceOpen(true)
	}

	async function handleManualSend() {
		if (!preparedSms) return
		await trackManualSms(preparedSms)
		setSendChoiceOpen(false)
		const manualText = (automaticSmsText || preparedSms.smsText).replaceAll(
			'{{formUrl}}',
			preparedSms.orderUrl
		)
		openSmsLink(phone, manualText)
	}

	async function handleAutomaticSend() {
		if (!preparedSms || autoState.status === 'sending') return

		setAutoState({
			status: 'sending',
			message: 'Wysyłanie przez SMSGate...',
		})

		try {
			const res = await crmFetch('/api/public/sms/send-form-link', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					phone,
					name,
					service,
					leadId: lead || null,
						visitDate: preparedSms.visitDate,
						visitTime: preparedSms.visitTime,
						templateKey: 'booking_form',
						messageOverride: automaticSmsText,
				}),
			})
			const json = await res.json().catch(() => null)

			if (!res.ok || !json?.ok) {
				throw new Error(json?.error || `SMSGate HTTP ${res.status}`)
			}

			const providerLine = json.providerMessageId
				? ` ID SMSGate: ${json.providerMessageId}`
				: ''
			setAutoState({
				status: 'success',
				message: `SMS wysłany do ${json.phone || phone}.${providerLine}`,
			})
		} catch (sendError) {
			setAutoState({
				status: 'error',
				message:
					sendError.message ||
					'Nie udało się wysłać SMS automatycznie przez SMSGate.',
			})
		}
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

			{sendChoiceOpen && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4'>
					<div className='w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl'>
						<div className='mb-4'>
							<p className='text-xs font-semibold uppercase tracking-[0.18em] text-orange-300'>
								Wysyłka SMS
							</p>
							<h2 className='mt-1 text-xl font-semibold text-white'>
								Wybierz sposób wysłania
							</h2>
							<p className='mt-2 text-sm text-slate-300'>
								Klient: {name || 'bez imienia'} · {phone}
							</p>
							<p className='text-sm text-slate-400'>
								Termin: {visitDate} {preparedSms?.visitTime || ''}
							</p>
							<div className='mt-3 rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-xs text-slate-300'>
								<p>
									Automatyczny profil:{' '}
									<span className='font-semibold text-orange-300'>
										{gateProfile?.profile || 'ładowanie...'}
									</span>
								</p>
								{gateProfile ? (
									<p className='mt-1 text-slate-400'>
										{gateProfile.senderPhone
											? `Telefon: ${gateProfile.senderPhone}`
											: 'Telefon: nie podano w .env'}
										{gateProfile.deviceId
											? ` · Device: ${gateProfile.deviceId}`
											: ''}
										{gateProfile.simNumber
											? ` · SIM ${gateProfile.simNumber}`
											: ''}
									</p>
								) : null}
							</div>
						</div>

						<div className='space-y-3'>
							<div className='rounded-xl border border-slate-700 bg-slate-950/50 p-3'>
							<div className='mb-2 flex items-center justify-between gap-3'>
								<label htmlFor='automatic-sms-preview' className='text-sm font-medium text-white'>
									Treść SMS automatycznego
								</label>
								<span className='text-xs text-slate-400'>
									{previewState.status === 'loading'
										? 'przygotowanie...'
										: previewState.knownCustomer
										? 'stały klient'
										: 'nowy klient'}
								</span>
							</div>
							<textarea
								id='automatic-sms-preview'
								value={automaticSmsText}
								onChange={event => setAutomaticSmsText(event.target.value)}
								disabled={autoState.status === 'sending'}
								rows={9}
								className='w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-5 text-slate-100 outline-none focus:border-orange-400 disabled:opacity-60'
							/>
							<p className='mt-2 text-xs text-slate-400'>
								Przed wysłaniem zostanie wstawiony unikalny link do formularza.
							</p>
							</div>

						<div className='grid gap-3 sm:grid-cols-2'>
							<button
								type='button'
								onClick={handleManualSend}
								disabled={autoState.status === 'sending'}
								className='rounded-xl border border-slate-600 bg-slate-800 px-4 py-4 text-left transition hover:border-orange-300 hover:bg-slate-800/80 disabled:cursor-not-allowed disabled:opacity-60'
							>
								<span className='block text-base font-semibold text-white'>
									Ręcznie
								</span>
								<span className='mt-1 block text-sm text-slate-400'>
									Otwórz aplikację SMS i wyślij wiadomość jak wcześniej.
								</span>
							</button>

							<button
								type='button'
								onClick={handleAutomaticSend}
								disabled={autoState.status === 'sending' || autoState.status === 'success'}
								className='rounded-xl border border-orange-400 bg-orange-500 px-4 py-4 text-left text-slate-950 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-70'
							>
								<span className='block text-base font-semibold'>
									Automatycznie
								</span>
								<span className='mt-1 block text-sm text-slate-900/80'>
									Wyślij przez SMS Gateway z telefonu firmowego.
								</span>
							</button>
						</div>

						{autoState.message && (
							<div
								className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
									autoState.status === 'success'
										? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-100'
										: autoState.status === 'error'
										? 'border-red-400/50 bg-red-500/10 text-red-100'
										: 'border-slate-600 bg-slate-800 text-slate-200'
								}`}
							>
								{autoState.message}
							</div>
						)}

						<div className='mt-5 flex justify-end gap-3'>
							<button
								type='button'
								onClick={() => setSendChoiceOpen(false)}
								disabled={autoState.status === 'sending'}
								className='rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60'
							>
								Zamknij
							</button>
						</div>
						</div>
					</div>
				</div>
				)}
		</div>
	)
}
