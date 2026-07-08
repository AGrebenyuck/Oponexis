'use client'

import OrderForm from '@/components/OrderForm'
import { crmFetch } from '@/lib/crm'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

export default function OrderPageClient({ params, services }) {
	const router = useRouter()
	const { lead, name, phone, service, visitDate, visitTime } = params || {}

	const initialData = {
		leadId: lead || null,
		name: name || '',
		phone: phone || '',
		service: service || '',
	}

	const [success, setSuccess] = useState(false)
	const [alreadySubmitted, setAlreadySubmitted] = useState(false)
	const [fallbackTermin, setFallbackTermin] = useState({
		visitDate: visitDate || '',
		visitTime: visitTime || '',
	})
	const effectiveVisitDate = visitDate || fallbackTermin.visitDate || ''
	const effectiveVisitTime = visitTime || fallbackTermin.visitTime || ''

	// ключ, по которому фиксируем "эта форма уже отправлена"
	const submissionKey = useMemo(() => {
		const base =
			lead ||
			[
				phone || 'no-phone',
				effectiveVisitDate || 'no-date',
				effectiveVisitTime || 'no-time',
			].join('_')

		return `order_submitted_${base}`
	}, [lead, phone, effectiveVisitDate, effectiveVisitTime])

	useEffect(() => {
		if (visitDate && visitTime) return
		if (!lead && !phone) return

		let cancelled = false

		async function loadFallbackTermin() {
			try {
				const params = new URLSearchParams()
				if (lead) params.set('leadId', lead)
				if (phone) params.set('phone', phone)
				const res = await crmFetch(`/api/public/sms/latest?${params.toString()}`)
				const json = await res.json()
				if (cancelled || !json.ok || !json.data) return
				setFallbackTermin({
					visitDate: json.data.visitDate || '',
					visitTime: json.data.visitTime || '',
				})
			} catch (error) {
				console.error('[order] failed to load SMS termin fallback', error)
			}
		}

		loadFallbackTermin()
		return () => {
			cancelled = true
		}
	}, [lead, phone, visitDate, visitTime])

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
