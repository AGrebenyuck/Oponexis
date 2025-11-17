'use client'

import OrderForm from '@/components/OrderForm'
import { useState } from 'react'

export default function OrderPageClient({ params, services }) {
	const { lead, name, phone, service, visitDate, visitTime } = params || {}

	const initialData = {
		leadId: lead || null,
		name: name || '',
		phone: phone || '',
		service: service || '',
	}

	const [success, setSuccess] = useState(false)

	// текст для показа клиенту
	let terminLabel = ''
	if (visitDate) {
		const [y, m, d] = String(visitDate).split('-')
		const dateStr = d && m && y ? `${d}.${m}.${y}` : visitDate
		terminLabel = visitTime ? `${dateStr}, ${visitTime}` : dateStr
	}

	return (
		<div className='min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4'>
			<div className='w-full max-w-md bg-slate-900/80 border border-slate-700 rounded-2xl p-6 shadow-xl'>
				{success ? (
					<p className='text-emerald-400 text-sm'>
						Dziękujemy! Twoje dane zostały zapisane. Do zobaczenia wkrótce 🚗
					</p>
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
