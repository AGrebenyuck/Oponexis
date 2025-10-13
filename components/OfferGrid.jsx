// components/OfferGrid.jsx
'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import 'swiper/css'
import 'swiper/css/navigation'
import { Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

import { getServices } from '@/actions/service'
import Button from '@/components/ui/button'
import Popover from '@/components/ui/Popover'

const LS_KEY = 'OPX_QR_FORM'

function Arrow({ dir = 'left' }) {
	return (
		<svg width='22' height='22' viewBox='0 0 24 24' fill='none' aria-hidden>
			{dir === 'left' ? (
				<path
					d='M15 18l-6-6 6-6'
					stroke='currentColor'
					strokeWidth='2'
					strokeLinecap='round'
					strokeLinejoin='round'
				/>
			) : (
				<path
					d='M9 6l6 6-6 6'
					stroke='currentColor'
					strokeWidth='2'
					strokeLinecap='round'
					strokeLinejoin='round'
				/>
			)}
		</svg>
	)
}

function ClockIcon({ className = '' }) {
	return (
		<svg
			className={className}
			width='14'
			height='14'
			viewBox='0 0 24 24'
			fill='none'
			aria-hidden
		>
			<circle cx='12' cy='12' r='9' stroke='currentColor' strokeWidth='2' />
			<path
				d='M12 7v5l3 2'
				stroke='currentColor'
				strokeWidth='2'
				strokeLinecap='round'
				strokeLinejoin='round'
			/>
		</svg>
	)
}

const RAW = [
	{
		key: '1',
		title: 'Wymiana i wyważanie kół',
		image: '/wheel-balancing.png',
		alt: 'Wymiana i wyważanie kół',
		duration: 'ok. 45–60 min',
		travelIncluded: true,
	},
	{
		key: '2',
		title: 'Wymiana oleju',
		image: '/oil-change.png',
		alt: 'Wymiana oleju',
		duration: 'ok. 30–45 min',
		travelIncluded: true,
	},
	{
		key: '4',
		title: 'Sezonowa wymiana opon',
		image: '/winter-summer.png',
		alt: 'Sezonowa wymiana opon',
		duration: 'ok. 60–90 min',
		travelIncluded: true,
	},
	{
		key: 'help-tyre',
		title: 'Pomoc z oponą',
		image: '/tyre-help.jpg',
		alt: 'Pomoc z oponą',
		duration: 'ok. 30–40 min',
		travelIncluded: true,
		isTyreHelp: true,
	},
	{
		key: '5',
		title: 'Przechowywanie kół w naszym magazynie',
		image: '/wheel-hold.png',
		alt: 'Przechowywanie kół',
		duration: null,
		travelIncluded: null,
	},
]

function OfferCard({ data, priceMeta, onSelect }) {
	const { title, image, alt, duration, travelIncluded, isTyreHelp } = data
	const hasDiscount =
		priceMeta?.originalPrice && priceMeta.originalPrice > priceMeta.price

	return (
		<div
			className='group relative rounded-3xl border border-white/15 bg-white/5 hover:border-white/25 hover:shadow-[0_6px_30px_-10px_rgba(0,0,0,0.45)]
                 overflow-hidden transition-all h-full grid grid-rows-[auto,auto,auto,1fr,auto,auto]'
		>
			{/* IMG */}
			<div className='relative w-full aspect-[5/4] overflow-hidden'>
				<Image
					src={image}
					alt={alt || title}
					fill
					className='object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]'
					sizes='(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw'
				/>
				<div className='pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/20' />
				{duration && (
					<span className='absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-[rgba(14,27,40,0.85)] text-white/95 border border-white/10 px-2.5 py-1 text-[11px] font-medium'>
						<ClockIcon /> {duration}
					</span>
				)}
			</div>

			{/* TITLE + PRICE */}
			<div className='p-4 sm:p-5 lg:p-6 pt-4 flex items-center justify-between gap-3'>
				<h3 className='text-white text-base sm:text-lg lg:text-xl font-semibold leading-snug line-clamp-2 pr-2'>
					{title}
				</h3>
				<span
					className='inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 self-start translate-y-[2px]'
					aria-label='Cena usługi'
				>
					{hasDiscount && (
						<span className='text-gray-300 line-through text-xs sm:text-sm'>
							{priceMeta.originalPrice} zł
						</span>
					)}
					<span className='text-secondary-orange text-sm sm:text-base lg:text-lg font-extrabold whitespace-nowrap'>
						{priceMeta?.price != null ? `${priceMeta.price} zł` : '— zł'}
					</span>
				</span>
			</div>

			{/* META / opis */}
			<div className='px-4 sm:px-5 lg:px-6 pb-1 min-h-[60px] md:min-h-[70px]'>
				{isTyreHelp ? (
					<div className='space-y-2'>
						<Popover
							placement='top'
							className='max-w-72'
							content={
								<div className='space-y-2'>
									<ul className='list-disc list-inside space-y-1 text-white'>
										<li>
											Dopompujemy i sprawdzimy koło (wentyl, ubytki,
											uszkodzenia).
										</li>
										<li>
											Spróbujemy tymczasowo załatać, by{' '}
											<b>bezpiecznie dojechać</b> do serwisu lub domu.
										</li>
										<li>
											Możemy też kupić oponę o tych samych parametrach i
											wymienić na miejscu (jeśli dostępna).
										</li>
									</ul>
									<hr className='border-gray-200' />
									<p className='text-secondary-orange text-xs'>
										* Nie wykonujemy naprawy opon na miejscu.
									</p>
								</div>
							}
						>
							<button className='inline-flex items-center gap-1 rounded-full bg-white/10 text-white/85 text-[11px] px-2.5 py-[6px] hover:bg-white/15 underline underline-offset-3'>
								<svg
									width='14'
									height='14'
									viewBox='0 0 24 24'
									className='opacity-90'
									aria-hidden
								>
									<path fill='currentColor' d='M11 7h2v2h-2zm0 4h2v6h-2z' />
									<path
										fill='currentColor'
										d='M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2m0 18a8 8 0 1 1 8-8a8.009 8.009 0 0 1-8 8'
									/>
								</svg>
								Szczegóły
							</button>
						</Popover>
					</div>
				) : (
					<div className='flex flex-wrap items-center gap-2 text-xs'>
						{travelIncluded && (
							<span className='inline-flex items-center gap-1 rounded-full bg-white/10 text-white px-2.5 py-1'>
								<span aria-hidden>★</span> Dojazd w cenie
							</span>
						)}
					</div>
				)}
			</div>

			{/* SPACER */}
			<div className='px-4 sm:px-5 lg:px-6' />

			{/* CTA */}
			<div className='px-4 sm:px-5 lg:px-6 pb-3'>
				<Button
					onClick={() => onSelect(title)}
					className='w-full p-4 sm:p-5 lg:px-2 bg-white text-primary-blue hover:bg-white/90'
				>
					Złóż zgłoszenie
				</Button>
			</div>

			{/* FOOTNOTE */}
			<div className='px-4 sm:px-5 lg:px-6 pb-4 text-[11px] text-white/70 min-h-[32px]'>
				{isTyreHelp ? (
					<span>* Nie wykonujemy naprawy opon na miejscu.</span>
				) : travelIncluded ? (
					<span>* Dojazd do klienta jest wliczony w cenę usługi.</span>
				) : (
					<span className='opacity-0'>placeholder</span>
				)}
			</div>
		</div>
	)
}

export default function OfferGrid({ title = 'NASZA OFERTA' }) {
	const [pricesPayload, setPricesPayload] = useState(null)

	useEffect(() => {
		let mounted = true
		;(async () => {
			try {
				const data = await getServices()
				if (mounted) setPricesPayload(data)
			} catch (e) {
				console.error('getServices failed:', e)
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
		if (!map.has('Pomoc z oponą')) {
			map.set('Pomoc z oponą', { id: '', price: null, originalPrice: null })
		}
		return map
	}, [pricesPayload])

	function selectFromCard(serviceTitle) {
		const meta = byName.get(serviceTitle)
		if (meta?.id) {
			const id = String(meta.id)
			const prev = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
			localStorage.setItem(LS_KEY, JSON.stringify({ ...prev, serviceId: id }))
			window.dispatchEvent(
				new CustomEvent('opx:service-selected', { detail: { serviceId: id } })
			)
		}
		try {
			window.dataLayer = window.dataLayer || []
			window.dataLayer.push({
				event: 'offer_cta_click',
				service_title: serviceTitle,
				service_id: meta?.id || null,
			})
		} catch {}
		document
			?.getElementById('reservation')
			?.scrollIntoView({ behavior: 'smooth', block: 'start' })
	}

	// ✅ GRID — только мобильные (< md)
	const Grid = (
		<ul className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:hidden'>
			{RAW.map(s => (
				<li key={s.key} className='h-full'>
					<OfferCard
						data={s}
						priceMeta={byName.get(s.title)}
						onSelect={selectFromCard}
					/>
				</li>
			))}
		</ul>
	)

	// ✅ SLIDER — планшет и десктоп (≥ md)
	const Slider = (
		<div className='hidden md:block'>
			<div className='relative'>
				<button
					className='custom-prev absolute -left-12 md:top-1/2 md:-translate-y-1/2 w-11 h-11 rounded-full bg-white text-primary-blue shadow
                     flex items-center justify-center hover:scale-105 transition z-[5]'
					aria-label='Poprzedni'
				>
					<Arrow dir='left' />
				</button>
				<button
					className='custom-next absolute -right-12 md:top-1/2 md:-translate-y-1/2 w-11 h-11 rounded-full bg-white text-primary-blue shadow
                     flex items-center justify-center hover:scale-105 transition z-[5]'
					aria-label='Następny'
				>
					<Arrow dir='right' />
				</button>

				<Swiper
					modules={[Navigation]}
					navigation={{ prevEl: '.custom-prev', nextEl: '.custom-next' }}
					spaceBetween={20}
					slidesPerGroup={1}
					breakpoints={{
						768: { slidesPerView: 2, spaceBetween: 20 }, // md
						1024: { slidesPerView: 3, spaceBetween: 24 }, // lg
						1440: { slidesPerView: 4, spaceBetween: 28 }, // 2xl+
					}}
					loop
					className='!overflow-hidden'
				>
					{RAW.map(s => (
						<SwiperSlide key={s.key} className='!h-auto'>
							<div className='h-full'>
								<OfferCard
									data={s}
									priceMeta={byName.get(s.title)}
									onSelect={selectFromCard}
								/>
							</div>
						</SwiperSlide>
					))}
				</Swiper>
			</div>
		</div>
	)

	return (
		<section
			aria-labelledby='nasza-oferta'
			id='services'
			className='container-padding pt-8 pb-10 lg:pb-16 flex flex-col gap-6'
		>
			<h2 id='nasza-oferta' className='title text-white'>
				{title}
			</h2>
			{Grid}
			{Slider}
		</section>
	)
}
