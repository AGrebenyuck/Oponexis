// components/OffersCards.jsx
'use client'

import { getServices } from '@/actions/service'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import Button from './ui/button'

const SERVICES = [
	{
		key: '1',
		title: 'Wymiana i wyważanie kół',
		image: '/wheel-balancing.png',
		alt: 'Wymiana i wyważanie kół',
	},
	{
		key: '2',
		title: 'Wymiana oleju',
		image: '/oil-change.png',
		alt: 'Wymiana oleju',
	},
	{
		key: '4',
		title: 'Sezonowa wymiana opon',
		image: '/winter-summer.png',
		alt: 'Sezonowa wymiana opon',
	},
	{
		key: '5',
		title: 'Przechowywanie kół w naszym magazynie',
		image: '/wheel-hold.png',
		alt: 'Przechowywanie kół',
	},
]

// Доп. бейджи, чтобы можно было кастомизировать на будущее
const PERKS = {
	'Wymiana i wyważanie kół': { slotsPerDay: 10, travelIncluded: true },
	'Wymiana oleju': { slotsPerDay: 8, travelIncluded: true },
	'Sezonowa wymiana opon': { slotsPerDay: 12, travelIncluded: true },
	'Przechowywanie kół w naszym magazynie': {
		slotsPerDay: null,
		travelIncluded: null,
	},
}

const LS_KEY = 'OPX_QR_FORM'

export default function OffersCards({ title = 'NASZA OFERTA' }) {
	const [pricesPayload, setPricesPayload] = useState(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let mounted = true
		;(async () => {
			try {
				const data = await getServices()
				if (mounted) setPricesPayload(data)
			} catch (e) {
				console.error('getServices failed:', e)
			} finally {
				if (mounted) setLoading(false)
			}
		})()
		return () => {
			mounted = false
		}
	}, [])

	const byName = useMemo(() => {
		const map = new Map()
		for (const s of pricesPayload?.prices || []) {
			map.set(String(s.name), {
				id: String(s.id ?? ''),
				price: s.price,
				originalPrice: s.originalPrice,
			})
		}
		return map
	}, [pricesPayload])

	function selectFromCard(serviceTitle) {
		const meta = byName.get(serviceTitle)
		if (!meta?.id) return
		const id = String(meta.id)

		const prev = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
		localStorage.setItem(LS_KEY, JSON.stringify({ ...prev, serviceId: id }))

		window.dispatchEvent(
			new CustomEvent('opx:service-selected', { detail: { serviceId: id } })
		)

		window.dataLayer = window.dataLayer || []
		window.dataLayer.push({
			event: 'offer_cta_click',
			service_title: serviceTitle,
			service_id: id,
		})

		document
			?.getElementById('reservation')
			?.scrollIntoView({ behavior: 'smooth', block: 'start' })
	}

	return (
		<section
			aria-labelledby='nasza-oferta'
			id='oferta'
			className='container-padding pt-8 pb-10 lg:pb-16 flex flex-col gap-5'
		>
			<h2 id='nasza-oferta' className='title text-white'>
				{title}
			</h2>

			<ul className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 items-stretch'>
				{SERVICES.map((s, idx) => {
					const meta = byName.get(s.title)
					const hasDiscount =
						meta?.originalPrice && meta.originalPrice > meta.price
					const perk = PERKS[s.title] || {}

					return (
						<li
							key={s.key}
							className='group relative rounded-3xl border border-white/15 bg-white/5 backdrop-blur-sm
                         overflow-hidden transition-all hover:border-white/25 hover:shadow-[0_6px_30px_-10px_rgba(0,0,0,0.45)]
                         flex flex-col h-full'
						>
							<div className='relative w-full aspect-[5/4] overflow-hidden'>
								<Image
									src={s.image}
									alt={s.alt || s.title}
									fill
									sizes='(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw'
									className='object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]'
									priority={idx === 0}
								/>
								<div className='pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/20' />
							</div>

							<div className='p-4 sm:p-5 lg:p-6 flex flex-col gap-3 flex-1'>
								<div className='flex items-start justify-between gap-3'>
									<h3 className='text-white text-base sm:text-lg lg:text-xl font-semibold leading-snug'>
										{s.title}
									</h3>
									<div className='shrink-0'>
										<span className='inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1'>
											{hasDiscount && (
												<span className='text-gray-300 line-through text-xs sm:text-sm'>
													{meta.originalPrice} zł
												</span>
											)}
											<span className='text-secondary-orange text-sm sm:text-base lg:text-lg font-extrabold'>
												{loading ? '—' : `${meta?.price ?? '—'} zł`}
											</span>
										</span>
									</div>
								</div>

								{/* Перки/бейджи под ценой */}
								<div className='flex flex-wrap items-center gap-2 text-xs'>
									{perk.travelIncluded && (
										<span className='inline-flex items-center gap-1 rounded-full bg-white/10 text-white px-2.5 py-1'>
											<span aria-hidden>★</span> Dojazd w cenie
										</span>
									)}
									{/* {typeof perk.slotsPerDay === 'number' && (
										<span className='inline-flex items-center gap-1 rounded-full bg-white/10 text-white/90 px-2.5 py-1'>
											{perk.slotsPerDay} slotów/dzień
										</span>
									)} */}
								</div>

								<Button
									onClick={() => selectFromCard(s.title)}
									className='mt-auto w-full p-4 sm:p-5 lg:px-2 bg-white text-primary-blue hover:bg-white/90'
								>
									Złóż zgłoszenie
								</Button>
							</div>

							{/* маленькая ремарка со звёздочкой внизу карточки */}
							{perk.travelIncluded && (
								<div className='px-4 pb-3 text-[11px] text-white/70'>
									* Dojazd do klienta jest wliczony w cenę usługi.
								</div>
							)}

							<span className='pointer-events-none absolute inset-0 rounded-3xl ring-0 ring-secondary-orange/0 group-hover:ring-2 group-hover:ring-secondary-orange/30 transition' />
						</li>
					)
				})}
			</ul>
		</section>
	)
}
