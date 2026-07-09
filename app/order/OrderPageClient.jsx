'use client'

import OrderForm from '@/components/OrderForm'
import { crmFetch } from '@/lib/crm'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

function normalizeVisitTime(value) {
	const raw = String(value || '').trim()
	if (!raw) return ''

	const decoded = raw.includes('%') ? decodeURIComponent(raw) : raw
	const exact = decoded.match(/^(\d{1,2})[:.](\d{2})(?::\d{2})?$/)
	if (exact) {
		const hours = Number(exact[1])
		const minutes = Number(exact[2])
		if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
			return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
		}
	}

	const compact = decoded.match(/^(\d{1,2})(\d{2})$/)
	if (compact) {
		const hours = Number(compact[1])
		const minutes = Number(compact[2])
		if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
			return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
		}
	}

	return ''
}

function normalizeTimePart(value, min, max) {
	const digits = String(value || '').replace(/\D/g, '')
	if (!digits) return ''

	const number = Number(digits)
	return Number.isInteger(number) && number >= min && number <= max
		? String(number).padStart(2, '0')
		: ''
}

function normalizeVisitTimeFromParts(hour, minute) {
	const normalizedHour = normalizeTimePart(hour, 0, 23)
	const normalizedMinute = normalizeTimePart(minute, 0, 59)

	return normalizedHour && normalizedMinute
		? `${normalizedHour}:${normalizedMinute}`
		: ''
}

export default function OrderPageClient({ params, services }) {
	const router = useRouter()
	const browserParams = useSearchParams()
	const getParam = name => browserParams.get(name) || params?.[name] || ''
	const {
		lead,
		name,
		phone,
		service,
		visitDate,
		visitTime,
		visitHour,
		visitMinute,
	} = params || {}
	const currentLead = getParam('lead') || lead || ''
	const currentName = getParam('name') || name || ''
	const currentPhone = getParam('phone') || phone || ''
	const currentService = getParam('service') || service || ''
	const currentVisitDate = getParam('visitDate') || visitDate || ''
	const currentVisitTime = getParam('visitTime') || visitTime || ''
	const currentVisitHour = getParam('visitHour') || visitHour || ''
	const currentVisitMinute = getParam('visitMinute') || visitMinute || ''
	const visitTimeFromParts = normalizeVisitTimeFromParts(
		currentVisitHour,
		currentVisitMinute
	)
	const queryVisitTime = normalizeVisitTime(currentVisitTime) || visitTimeFromParts

	const initialData = {
		leadId: currentLead || null,
		name: currentName || '',
		phone: currentPhone || '',
		service: currentService || '',
	}

	const [success, setSuccess] = useState(false)
	const [alreadySubmitted, setAlreadySubmitted] = useState(false)
	const [fallbackTermin, setFallbackTermin] = useState({
		visitDate: currentVisitDate || '',
		visitTime: queryVisitTime || '',
	})
	const effectiveVisitDate = currentVisitDate || fallbackTermin.visitDate || ''
	const effectiveVisitTime =
		queryVisitTime || normalizeVisitTime(fallbackTermin.visitTime) || ''

	// ключ, по которому фиксируем "эта форма уже отправлена"
	const submissionKey = useMemo(() => {
		const base =
			currentLead ||
			[
				currentPhone || 'no-phone',
				effectiveVisitDate || 'no-date',
				effectiveVisitTime || 'no-time',
			].join('_')

		return `order_submitted_${base}`
	}, [currentLead, currentPhone, effectiveVisitDate, effectiveVisitTime])

	useEffect(() => {
		if (currentVisitDate && queryVisitTime) return
		if (!currentLead && !currentPhone) return

		let cancelled = false

		async function loadFallbackTermin() {
			try {
				const params = new URLSearchParams()
				if (currentLead) params.set('leadId', currentLead)
				if (currentPhone) params.set('phone', currentPhone)
				const res = await crmFetch(`/api/public/sms/latest?${params.toString()}`)
				const json = await res.json()
				if (cancelled || !json.ok || !json.data) return
				setFallbackTermin({
					visitDate: json.data.visitDate || '',
					visitTime: normalizeVisitTime(json.data.visitTime) || '',
				})
			} catch (error) {
				console.error('[order] failed to load SMS termin fallback', error)
			}
		}

		loadFallbackTermin()
		return () => {
			cancelled = true
		}
	}, [currentLead, currentPhone, currentVisitDate, queryVisitTime])

	// при первом заходе по ссылке — проверяем, нет ли уже отправки
	useEffect(() => {
		if (typeof window === 'undefined') return
		const flag = window.localStorage.getItem(submissionKey)
		if (flag === '1') setAlreadySubmitted(true)
	}, [submissionKey])

	// после успешной отправки ставим флаг + редиректим на главную
	useEffect(() => {
		if (!success) return
		if (typeof window !== 'undefined') {
			window.localStorage.setItem(submissionKey, '1')
		}
		const t = setTimeout(() => {
			router.push('/')
		}, 6000)
		return () => clearTimeout(t)
	}, [success, router, submissionKey])

	// текст термина для отображения
	let terminLabel = ''
	if (effectiveVisitDate) {
		const [y, m, d] = String(effectiveVisitDate).split('-')
		const dateStr = d && m && y ? `${d}.${m}.${y}` : effectiveVisitDate
		terminLabel = effectiveVisitTime ? `${dateStr}, ${effectiveVisitTime}` : dateStr
	}

	return (
		<div className='min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4'>
			<div className='w-full max-w-lg bg-slate-900/80 border border-slate-700 rounded-2xl p-6 shadow-xl'>
				{success ? (
					<p className='text-emerald-400 text-sm'>
						Dziękujemy! Twoje dane zostały zapisane. Do zobaczenia wkrótce 🚗
						<br />
						<span className='text-slate-400 text-xs'>
							Za chwilę przeniesiemy Cię na stronę główną…
						</span>
					</p>
				) : alreadySubmitted ? (
					<div className='space-y-3 text-sm'>
						<p className='text-emerald-300'>
							Mamy już zapisane dane do tej wizyty. Nie musisz wysyłać
							formularza ponownie ✅
						</p>
						{terminLabel && (
							<p className='rounded-lg border border-orange-400/40 bg-orange-500/10 px-3 py-2 text-orange-200'>
								Termin wizyty:{' '}
								<strong className='text-orange-100'>{terminLabel}</strong>
							</p>
						)}
						<p className='text-slate-400'>
							Jeśli coś się zmieniło (np. adres, kolor auta) możesz
							zaktualizować dane.
						</p>
						<div className='flex gap-3'>
							<button
								className='flex-1 rounded-lg bg-orange-500 hover:bg-orange-600 py-2 text-xs font-medium'
								onClick={() => setAlreadySubmitted(false)}
							>
								✏️ Edytuj dane
							</button>
							<button
								className='flex-1 rounded-lg bg-slate-800 hover:bg-slate-700 py-2 text-xs font-medium text-slate-100 border border-slate-600'
								onClick={() => router.push('/')}
							>
								🏠 Strona główna
							</button>
						</div>
					</div>
				) : (
					<>
						<h1 className='text-xl font-semibold mb-1'>
							Uzupełnij dane do wizyty
						</h1>

						{terminLabel ? (
							<p className='mb-3 rounded-lg border border-orange-400/40 bg-orange-500/10 px-3 py-2 text-sm text-orange-200'>
								Termin wizyty:{' '}
								<strong className='text-orange-100'>{terminLabel}</strong>
							</p>
						) : null}

						<p className='text-sm text-slate-400 mb-4'>
							Potrzebujemy kilku informacji, aby szybciej do Ciebie dojechać.
						</p>

						<OrderForm
							initialData={initialData}
							services={services}
							visitDate={effectiveVisitDate}
							visitTime={effectiveVisitTime}
							onSuccess={() => setSuccess(true)}
						/>
					</>
				)}
			</div>
		</div>
	)
}
