// components/OfferGrid.jsx
'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import 'swiper/css'
import 'swiper/css/navigation'
import { Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

import { getServices } from '@/actions/service'
import Popover from './ui/popover'

const LS_KEY = 'OPX_QR_FORM'

/* ================= Icons ================= */
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
function ClockIcon() {
	return (
		<svg width='14' height='14' viewBox='0 0 24 24' fill='none' aria-hidden>
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

/* ================= Data ================= */
const RAW = [
	{
		key: 'Wymiana i wyważanie kół',
		title: 'Wymiana i wyważanie kół',
		image: '/wheel-balancing.png',
		alt: 'Wymiana i wyważanie kół',
		duration: 'ok. 45–60 min',
		chips: [{ label: 'Dojazd w cenie', mark: '*' }],
		footnotes: [
			{ mark: '*', text: 'Dojazd do klienta jest wliczony w cenę usługi.' },
			{
				mark: '**',
				text: 'Cena stała — niezależnie od liczby kół (1–4 szt.).',
			},
		],
		priceMark: '**',
	},
	{
		key: 'Wymiana oleju',
		title: 'Wymiana oleju',
		image: '/oil-change.png',
		alt: 'Wymiana oleju',
		duration: 'ok. 30–45 min',
		chips: [{ label: 'Dojazd w cenie', mark: '*' }],
		footnotes: [
			{ mark: '*', text: 'Dojazd do klienta jest wliczony w cenę usługi.' },
		],
		priceMark: '',
	},
	{
		key: 'Sezonowa wymiana opon',
		title: 'Sezonowa wymiana opon',
		image: '/winter-summer.png',
		alt: 'Sezonowa wymiana opon',
		duration: 'ok. 60–90 min',
		chips: [{ label: 'Dojazd w cenie', mark: '*' }],
		footnotes: [
			{ mark: '*', text: 'Dojazd do klienta jest wliczony w cenę usługi.' },
			{
				mark: '**',
				text: 'Cena stała — niezależnie od liczby kół (1–4 szt.).',
			},
		],
		priceMark: '**',
	},
	{
		key: 'Pomoc z oponą',
		title: 'Pomoc z oponą *',
		image: '/tyre-help.jpg',
		alt: 'Pomoc z oponą',
		duration: 'ok. 30–40 min',
		chips: [],
		footnotes: [{ mark: '*', text: 'Nie wykonujemy naprawy opon na miejscu.' }],
		priceMark: '',
		isTyreHelp: true,
	},
	{
		key: 'Przechowywanie kół w naszym magazynie',
		title: 'Przechowywanie kół w naszym magazynie',
		image: '/wheel-hold.png',
		alt: 'Przechowywanie kół',
		duration: null,
		chips: [],
		footnotes: [],
		priceMark: '',
	},
]

/* ================= Card ================= */
function renderTitleWithMark(title) {
	// Заменяем одиночные * на оранжевую звездочку (не трогаем **)
	// Простой кейс: "Pomoc z oponą*" -> "Pomoc z oponą<sup class=...>*</sup>"
	return title.replace(
		/(^|[^*])\*(?!\*)/g,
		(_, p1) => `${p1}<span class="text-secondary-orange ">*</span>`
	)
}

function OfferCard({ data, priceMeta, onSelect }) {
	const {
		title,
		image,
		alt,
		duration,
		chips = [],
		footnotes = [],
		priceMark = '',
		isTyreHelp = false,
	} = data

	const hasDiscount =
		priceMeta?.originalPrice && priceMeta.originalPrice > priceMeta.price

	return (
		<div
			className='group relative w-full h-full box-border
                 flex flex-col rounded-3xl border border-white/15 bg-white/5
                 hover:border-white/25 hover:shadow-[0_6px_30px_-10px_rgba(0,0,0,0.45)]
                 overflow-hidden transition-all'
			data-card
		>
			{/* TOP — IMG */}
			<div className='relative w-full aspect-[5/4] overflow-hidden shrink-0'>
				<Image
					src={image}
					alt={alt || title}
					fill
					className='object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]'
					sizes='(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw'
				/>
				{duration && (
					<span className='absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-[rgba(14,27,40,0.85)] text-white/95 border border-white/10 px-2.5 py-1 text-[11px] font-medium'>
						<ClockIcon /> {duration}
					</span>
				)}
				<div className='pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/20' />
			</div>

			{/* MIDDLE — CONTENT (тянется). 
          СТАБИЛИЗАЦИЯ: даём head/chips фиксированные min-h */}
			<div className='flex-1 flex flex-col p-4 sm:p-5 lg:p-6 pt-2'>
				{/* HEAD: title + price */}
				<div
					className='flex items-center justify-between gap-3 min-w-0
                     min-h-[50px] md:min-h-[78px]'
					data-slot='head'
				>
					<h3
						className='text-white text-base sm:text-lg lg:text-xl font-semibold leading-snug pr-2 min-w-0'
						dangerouslySetInnerHTML={{ __html: renderTitleWithMark(title) }}
					/>
					<span
						className='inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1'
						aria-label='Cena usługi'
					>
						{hasDiscount && (
							<span className='text-gray-300 line-through text-xs sm:text-sm'>
								{priceMeta.originalPrice} zł
							</span>
						)}
						<span className='text-secondary-orange text-sm sm:text-base lg:text-lg font-extrabold whitespace-nowrap'>
							{priceMeta?.price != null
								? `${priceMeta.price} zł ${priceMark}`
								: '— zł'}
						</span>
					</span>
				</div>

				{/* CHIPS */}
				<div className='mt-3 min-h-[34px] md:min-h-[38px]' data-slot='chips'>
					{isTyreHelp ? (
						<div className='inline-block'>
							<Popover
								placement='top'
								className='max-w-72'
								content={
									<div className='space-y-2'>
										<ul className='list-disc list-inside space-y-1 text-white'>
											<li>Dopompujemy i sprawdzimy koło.</li>
											<li>
												Spróbujemy tymczasowo załatać, by bezpiecznie dojechać.
											</li>
											<li>
												Możemy też wymienić oponę na miejscu (jeśli dostępna).
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
										<path fill='#FD6D02' d='M11 7h2v2h-2zm0 4h2v6h-2z' />
										<path
											fill='#FD6D02'
											d='M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2m0 18a8 8 0 1 1 8-8a8.009 8.009 0 0 1-8 8'
										/>
									</svg>
									Szczegóły
								</button>
							</Popover>
						</div>
					) : (
						<div className='flex flex-wrap items-center gap-2 text-xs'>
							{chips.map((c, i) => (
								<span
									key={i}
									className='inline-flex items-center gap-1 rounded-full bg-white/10 text-white px-2.5 py-1'
								>
									{c.label}
									{c.mark && <b className='text-secondary-orange'>{c.mark}</b>}
								</span>
							))}
						</div>
					)}
				</div>

				{/* spacer — выталкивает кнопку вниз, но НЕ влияет на сноски */}
				<div className='mt-auto' />
			</div>

			{/* === BOTTOM: кнопка и сноски === */}
			<div className='w-full flex flex-col flex-grow md:flex-none'>
				{/* Кнопка — одинаковая линия на десктопе */}
				<div className='px-4 sm:px-5 lg:px-6 pb-3'>
					<button
						onClick={() => onSelect(data.key)}
						className='w-full h-[52px] sm:h-[56px] rounded-xl lg:rounded-3xl
                 bg-white text-primary-blue hover:bg-white/90 transition
                 text-lg md:text-xl font-medium whitespace-nowrap'
					>
						Złóż zgłoszenie
					</button>
				</div>

				{/* Сноски */}
				<div
					className={`
      px-4 sm:px-5 lg:px-6 pb-4 text-[11px] text-white/75 leading-[1.35]
      md:flex md:flex-col md:justify-end  /* ← прижимаем к низу только на десктопе */
      md:min-h-[70px]                     /* ← одинаковая высота зоны на Swiper */
      h-auto                              /* ← на мобилке — авто */
    `}
				>
					{footnotes.length ? (
						<ul className='space-y-[2px]'>
							{footnotes.map(n => (
								<li key={n.mark} className='flex'>
									<span className='text-secondary-orange mr-1'>{n.mark}</span>
									<span>{n.text}</span>
								</li>
							))}
						</ul>
					) : (
						<span className='opacity-0'>—</span>
					)}
				</div>
			</div>
		</div>
	)
}

/* ================= Grid Wrapper ================= */
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

	const selectFromCard = serviceTitle => {
		const meta = byName.get(serviceTitle)
		if (meta?.id) {
			const id = String(meta.id)
			const prev = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
			localStorage.setItem(LS_KEY, JSON.stringify({ ...prev, serviceId: id }))
			window.dispatchEvent(
				new CustomEvent('opx:service-selected', { detail: { serviceId: id } })
			)
		}
		document
			?.getElementById('reservation')
			?.scrollIntoView({ behavior: 'smooth', block: 'start' })
	}

	return (
		<section
			id='services'
			aria-labelledby='nasza-oferta'
			className='container-padding pt-8 flex flex-col gap-6'
		>
			<h2 id='nasza-oferta' className='title text-white'>
				{title}
			</h2>

			{/* Mobile grid */}
			<ul className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:hidden'>
				{RAW.map(s => (
					<li key={s.key} className='h-full'>
						<OfferCard
							data={s}
							priceMeta={byName.get(s.key)}
							onSelect={selectFromCard}
						/>
					</li>
				))}
			</ul>

			{/* Slider (md+) */}
			<div className='hidden md:block'>
				<div className='relative'>
					<button
						className='custom-prev absolute -left-12 md:top-1/2 md:-translate-y-1/2 w-11 h-11 rounded-full bg-white text-primary-blue shadow flex items-center justify-center hover:scale-105 transition z-[5]'
						aria-label='Poprzedni'
					>
						<Arrow dir='left' />
					</button>
					<button
						className='custom-next absolute -right-12 md:top-1/2 md:-translate-y-1/2 w-11 h-11 rounded-full bg-white text-primary-blue shadow flex items-center justify-center hover:scale-105 transition z-[5]'
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
							768: { slidesPerView: 2, spaceBetween: 20 },
							1024: { slidesPerView: 3, spaceBetween: 24 },
							1440: { slidesPerView: 4, spaceBetween: 28 },
						}}
						loop
						className=''
					>
						{RAW.map(s => (
							<SwiperSlide key={s.key} className='!h-auto'>
								{/* ВАЖНО: wrapper тянет карточку на всю высоту слайда */}
								<div className='h-full flex'>
									<OfferCard
										data={s}
										priceMeta={byName.get(s.key)}
										onSelect={selectFromCard}
									/>
								</div>
							</SwiperSlide>
						))}
					</Swiper>
				</div>
			</div>
		</section>
	)
}
