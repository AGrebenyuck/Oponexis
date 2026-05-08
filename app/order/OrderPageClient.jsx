'use client'

import OrderForm from '@/components/OrderForm'
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

	// ключ, по которому фиксируем "эта форма уже отправлена"
	const submissionKey = useMemo(() => {
		const base =
			lead ||
			[
				phone || 'no-phone',
				visitDate || 'no-date',
				visitTime || 'no-time',
			].join('_')

		return `order_submitted_${base}`
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
	if (visitDate) {
		const [y, m, d] = String(visitDate).split('-')
		const dateStr = d && m && y ? `${d}.${m}.${y}` : visitDate
		terminLabel = visitTime ? `${dateStr}, ${visitTime}` : dateStr
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
							<p className='text-orange-300'>
								Termin wizyty: <strong>{terminLabel}</strong>
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
							<p className='text-sm text-orange-300 mb-1'>
								Termin wizyty: {terminLabel}
							</p>
						) : null}

						<p className='text-sm text-slate-400 mb-4'>
							Potrzebujemy kilku informacji, aby szybciej do Ciebie dojechać.
						</p>

						<OrderForm
							initialData={initialData}
							services={services}
							visitDate={visitDate}
							visitTime={visitTime}
							onSuccess={() => setSuccess(true)}
						/>
					</>
				)}
			</div>
		</div>
	)
}
