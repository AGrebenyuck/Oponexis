// components/OfferGrid.jsx
'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'

import { getServices } from '@/lib/crm'
import { getDetailsContent } from './serviceDetails'
import Popover from './ui/popover'

const LS_KEY = 'OPX_QR_FORM'

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

function InfoIcon() {
	return (
		<svg width='14' height='14' viewBox='0 0 24 24' aria-hidden>
			<path fill='#FD6D02' d='M11 7h2v2h-2zm0 4h2v6h-2z' />
			<path
				fill='#FD6D02'
				d='M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2m0 18a8 8 0 1 1 8-8a8.009 8.009 0 0 1-8 8'
			/>
		</svg>
	)
}

function BenefitIcon({ type }) {
	const common = {
		width: 18,
		height: 18,
		viewBox: '0 0 24 24',
		fill: 'none',
		'aria-hidden': true,
	}
	if (type === 'route') {
		return (
			<svg {...common}>
				<path
					d='M5 17c4-7 10 1 14-6'
					stroke='currentColor'
					strokeWidth='2'
					strokeLinecap='round'
				/>
				<circle cx='5' cy='17' r='2' stroke='currentColor' strokeWidth='2' />
				<circle cx='19' cy='11' r='2' stroke='currentColor' strokeWidth='2' />
			</svg>
		)
	}
	if (type === 'bag') {
		return (
			<svg {...common}>
				<path
					d='M7 9h10l-1 10H8L7 9Z'
					stroke='currentColor'
					strokeWidth='2'
					strokeLinejoin='round'
				/>
				<path
					d='M9 9a3 3 0 0 1 6 0'
					stroke='currentColor'
					strokeWidth='2'
					strokeLinecap='round'
				/>
			</svg>
		)
	}
	if (type === 'percent') {
		return (
			<svg {...common}>
				<path
					d='M6 18 18 6'
					stroke='currentColor'
					strokeWidth='2'
					strokeLinecap='round'
				/>
				<circle cx='7.5' cy='7.5' r='2' stroke='currentColor' strokeWidth='2' />
				<circle
					cx='16.5'
					cy='16.5'
					r='2'
					stroke='currentColor'
					strokeWidth='2'
				/>
			</svg>
		)
	}
	return (
		<svg {...common}>
			<path
				d='M12 3v3M12 18v3M4.7 4.7l2.1 2.1M17.2 17.2l2.1 2.1M3 12h3M18 12h3M4.7 19.3l2.1-2.1M17.2 6.8l2.1-2.1'
				stroke='currentColor'
				strokeWidth='2'
				strokeLinecap='round'
			/>
			<circle cx='12' cy='12' r='3' stroke='currentColor' strokeWidth='2' />
		</svg>
	)
}

const RAW = [
	{
		key: 'Sezonowa wymiana kół',
		title: 'Sezonowa wymiana kół',
		image: '/wheel-balancing.webp',
		alt: 'Sezonowa wymiana kół',
		duration: 'ok. 45-60 min',
		summary:
			'Najprostsza opcja, gdy masz drugi komplet kół i chcesz tylko szybkiej wymiany pod domem albo pracą.',
		chips: [{ label: 'Dojazd w cenie', mark: '*' }],
		priceRows: [
			{ label: 'Auto osobowe', price: '150 zł', mark: '**' },
			{
				label: 'Bus',
				price: '180 zł',
				mark: '**',
				hint: 'Dotyczy większych busów. Przy mniejszych autach typu Renault Trafic lub Mercedes Vito cenę potwierdzimy telefonicznie.',
			},
		],
		footnotes: [
			{ mark: '*', text: 'Dojazd do klienta jest wliczony w cenę usługi.' },
			{
				mark: '**',
				text: 'Cena stała niezależnie od liczby kół: od 1 do 4 szt.',
			},
		],
	},
	{
		key: 'Wymiana opon',
		title: 'Wymiana opon',
		image: '/winter-summer.webp',
		alt: 'Wymiana opon',
		duration: 'ok. 60-90 min',
		priceLayout: 'grid',
		summary:
			'Przekładamy same opony na felgach, a potem wyważamy koła na miejscu.',
		chips: [{ label: 'Dojazd w cenie', mark: '*' }],
		priceRows: [
			{ label: 'R13-R16', price: '220 zł', mark: '**' },
			{ label: 'R17-R19', price: '250 zł', mark: '**' },
			{
				label: 'Busy do 3.5t',
				price: '300 zł',
				mark: '**',
				hint: 'Cena 300 zł dotyczy dużych busów, np. Renault Master albo Fiat Ducato. Mniejsze auta typu Renault Trafic lub Mercedes Vito zwykle liczymy jak R17-R19.',
			},
			{ label: 'R20+', price: 'nie wykonujemy', muted: true },
		],
		footnotes: [
			{ mark: '*', text: 'Dojazd do klienta jest wliczony w cenę usługi.' },
			{
				mark: '**',
				text: 'Cena stała niezależnie od liczby kół: od 1 do 4 szt.',
			},
		],
	},
	{
		key: 'Pomoc z oponą',
		title: 'Pomoc z oponą *',
		image: '/tyre-help.webp',
		alt: 'Pomoc z oponą',
		duration: 'ok. 30-40 min',
		summary:
			'Awaryjny dojazd, gdy złapiesz gumę i nie chcesz od razu wzywać drogiej lawety.',
		chips: [{ label: 'Awaryjnie' }],
		priceRows: [
			{ label: 'Naprawa opony z demontażem', price: '200 zł' },
			{ label: 'Wymiana wentyla', price: '150 zł' },
		],
		footnotes: [
			{
				mark: '*',
				text: 'Naprawa zależy od uszkodzenia i możliwości wykonania jej na miejscu.',
			},
		],
	},
	{
		key: 'Przechowywanie kół w naszym magazynie',
		title: 'Przechowywanie kół',
		image: '/wheel-hold.webp',
		alt: 'Przechowywanie kół',
		duration: null,
		summary:
			'Koła nie zajmują miejsca w domu, piwnicy ani garażu. Przy kolejnym sezonie są już u nas.',
		chips: [{ label: 'W naszym magazynie' }],
		priceRows: [{ label: 'Przechowywanie', price: '50 zł / sezon' }],
		footnotes: [],
	},
]

const PACKAGES = [
	{
		name: 'Standard',
		tag: 'Podstawowy',
		lead: 'Dla kierowcy, który chce szybko zamknąć sezon bez jazdy do warsztatu.',
		items: [
			'Przyjazd pod dom albo pracę',
			'Worki na koła po wymianie',
			'Kontakt przed kolejnym sezonem',
			'10% zniżki na kolejną sezonową wymianę',
		],
	},
	{
		name: 'Komfort',
		tag: 'Spokój na sezon',
		lead: 'Dla osób, które chcą jedną rozmową ogarnąć wymianę, dodatki, terminy i plan awaryjny.',
		items: [
			'Wszystko ze Standard',
			'Pomoc z oponą do 30 km od Opola w ustalonej cenie',
			'Ozonowanie auta przy wizycie',
			'Dwie wizyty sezonowe do ustalenia',
			'Pierwszeństwo wolnych terminów',
		],
		featured: true,
	},
]

const PACKAGE_BENEFITS = [
	{ icon: 'route', value: '30 km', label: 'pomoc w trasie' },
	{ icon: 'bag', value: 'worki', label: 'na koła po wymianie' },
	{ icon: 'spark', value: 'ozon', label: 'w pakiecie Komfort' },
	{ icon: 'percent', value: '-10%', label: 'na kolejny sezon' },
]

function renderTitleWithMark(title) {
	return title
		.replace(/\*\*/g, '<span class="text-secondary-orange">**</span>')
		.replace(
			/(^|[^*])\*(?!\*)/g,
			(_, p1) => `${p1}<span class="text-secondary-orange">*</span>`
		)
}

function OfferCard({ data, onSelect }) {
	const {
		title,
		image,
		alt,
		duration,
		summary,
		priceLayout,
		chips = [],
		footnotes = [],
		priceRows = [],
	} = data

	const detailsContent = getDetailsContent(data.key)

	return (
		<div
			className='group relative w-full sm:h-full box-border flex flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/5 transition-all hover:border-white/25 hover:shadow-[0_6px_30px_-10px_rgba(0,0,0,0.45)]'
			data-card
		>
			<div className='relative w-full aspect-[2.05/1] overflow-hidden shrink-0'>
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

			<div className='flex flex-col sm:flex-1 p-4 sm:p-5 lg:p-5 pt-3'>
				<div className='flex items-start justify-between gap-3 min-w-0'>
					<h3
						className='text-white text-lg sm:text-lg lg:text-[19px] font-semibold leading-snug min-w-0'
						dangerouslySetInnerHTML={{ __html: renderTitleWithMark(title) }}
					/>
				</div>

				<div className='mt-3' data-slot='chips'>
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

						{detailsContent && (
							<Popover
								placement='top'
								className='max-w-80'
								content={detailsContent}
							>
								<button
									type='button'
									className='inline-flex items-center gap-1 rounded-full bg-white/10 text-white/85 text-[11px] px-2.5 py-[6px] hover:bg-white/15 underline underline-offset-3'
								>
									<InfoIcon />
									Szczegóły
								</button>
							</Popover>
						)}
					</div>
				</div>

				{summary && (
					<p className='mt-3 text-[13px] leading-relaxed text-white/70'>
						{summary}
					</p>
				)}

				{priceLayout === 'grid' ? (
					<div className='mt-3 overflow-hidden rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.06)] sm:grid sm:grid-cols-2'>
						{priceRows.map(row => (
							<div
								key={`${row.label}-${row.price}`}
								className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-white/10 px-3 py-2 text-[13px] sm:block sm:min-h-[58px] sm:border-r sm:px-2.5 sm:py-2 sm:odd:border-r sm:even:border-r-0 sm:[&:nth-last-child(-n+2)]:border-b-0 xl:min-h-[54px]'
							>
								<div className='flex items-center gap-1.5 text-white/82 sm:min-h-[24px] sm:items-start'>
									<span className='leading-tight sm:text-[12px] xl:text-[13px]'>
										{row.label}
									</span>
									{row.hint && (
										<Popover
											placement='top'
											className='max-w-72'
											content={
												<p className='text-sm leading-relaxed'>{row.hint}</p>
											}
										>
											<button
												type='button'
												className='inline-flex shrink-0 rounded-full hover:bg-white/10 sm:mt-[1px]'
												aria-label={`Wyjaśnienie ceny: ${row.label}`}
											>
												<InfoIcon />
											</button>
										</Popover>
									)}
								</div>
								<strong
									className={`block text-right leading-tight sm:mt-1 ${
										row.muted
											? 'text-sm text-white/65 sm:text-[13px]'
											: 'text-base text-secondary-orange sm:text-[17px]'
									}`}
								>
									{row.price}
									{row.mark && (
										<span className='ml-0.5 text-secondary-orange'>
											{row.mark}
										</span>
									)}
								</strong>
							</div>
						))}
					</div>
				) : (
					<div className='mt-3 rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.06)] overflow-hidden'>
						{priceRows.map(row => (
							<div
								key={`${row.label}-${row.price}`}
								className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-white/10 last:border-b-0 px-3 py-2 text-[13px] sm:text-sm'
							>
								<span className='text-white/85 inline-flex items-center gap-1.5'>
									{row.label}
									{row.hint && (
										<Popover
											placement='top'
											className='max-w-72'
											content={
												<p className='text-sm leading-relaxed'>{row.hint}</p>
											}
										>
											<button
												type='button'
												className='inline-flex rounded-full hover:bg-white/10'
												aria-label={`Wyjaśnienie ceny: ${row.label}`}
											>
												<InfoIcon />
											</button>
										</Popover>
									)}
								</span>
								<strong
									className={`text-right text-base whitespace-nowrap ${
										row.muted ? 'text-white/65' : 'text-secondary-orange'
									}`}
								>
									{row.price}
									{row.mark && (
										<span className='ml-0.5 text-secondary-orange'>
											{row.mark}
										</span>
									)}
								</strong>
							</div>
						))}
					</div>
				)}
			</div>

			<div className='w-full flex flex-col sm:mt-auto'>
				<div className='px-4 sm:px-5 lg:px-5 pb-3'>
					<button
						onClick={() => onSelect(data.key)}
						className='w-full h-12 rounded-xl lg:rounded-2xl bg-white text-primary-blue hover:bg-white/90 transition text-base md:text-lg font-medium whitespace-nowrap'
					>
						Złóż zgłoszenie
					</button>
				</div>

				<div
					className={`px-4 sm:px-5 lg:px-5 pb-4 text-[11px] text-white/75 leading-[1.35] ${
						footnotes.length === 0 ? 'hidden sm:block invisible' : ''
					}`}
				>
					{footnotes.length > 0 ? (
						<ul className='space-y-[2px]'>
							{footnotes.map(n => (
								<li key={n.mark} className='flex'>
									<span className='text-secondary-orange mr-1'>{n.mark}</span>
									<span>{n.text}</span>
								</li>
							))}
						</ul>
					) : (
						<ul className='space-y-[2px]'>
							<li className='flex'>
								<span>placeholder</span>
							</li>
							<li className='flex'>
								<span>placeholder</span>
							</li>
						</ul>
					)}
				</div>
			</div>
		</div>
	)
}

function PackageCard({ pkg, onSelect }) {
	return (
		<div
			className={`rounded-3xl border p-4 sm:p-5 h-full flex flex-col bg-white/[0.06] ${
				pkg.featured
					? 'border-secondary-orange/70 shadow-[0_14px_40px_-24px_rgba(253,109,2,0.8)]'
					: 'border-white/15'
			}`}
		>
			<div className='flex items-start justify-between gap-3'>
				<div>
					<span className='inline-flex rounded-full bg-secondary-orange/15 px-2.5 py-1 text-[11px] font-semibold text-secondary-orange'>
						{pkg.tag}
					</span>
					<h3 className='mt-3 text-xl font-semibold text-white'>{pkg.name}</h3>
				</div>
				{pkg.featured && (
					<span className='rounded-full bg-white text-primary-blue px-2.5 py-1 text-[11px] font-bold'>
						Propozycja
					</span>
				)}
			</div>
			<p className='mt-3 text-sm leading-relaxed text-white/78'>{pkg.lead}</p>
			<ul className='mt-4 space-y-2 text-sm text-white/82'>
				{pkg.items.map(item => (
					<li key={item} className='flex gap-2'>
						<span className='mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-secondary-orange' />
						<span>{item}</span>
					</li>
				))}
			</ul>
			<div className='mt-auto pt-5'>
				<button
					type='button'
					onClick={() => onSelect(pkg.name)}
					className='w-full h-12 rounded-xl bg-white text-primary-blue hover:bg-white/90 transition font-semibold'
				>
					Zapytaj o pakiet
				</button>
			</div>
		</div>
	)
}

function PackageBenefitsPanel() {
	return (
		<div className='rounded-2xl sm:rounded-3xl border border-white/15 bg-white/[0.075] p-2.5 sm:p-3 lg:p-4'>
			<div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
				{PACKAGE_BENEFITS.map(item => (
					<div
						key={item.value}
						className='rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.08] px-2 py-2 sm:py-3 text-center'
					>
						<div className='mx-auto grid h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 place-items-center rounded-full bg-secondary-orange/15 text-secondary-orange'>
							<BenefitIcon type={item.icon} />
						</div>
						<div className='mt-1.5 sm:mt-2 text-xs sm:text-sm lg:text-base font-extrabold leading-none text-white'>
							{item.value}
						</div>
						<div className='mt-1 text-[9px] lg:text-[10px] leading-tight text-white/65'>
							{item.label}
						</div>
					</div>
				))}
			</div>
			<p className='mt-2 sm:mt-3 text-center text-[11px] sm:text-xs text-white/70'>
				Najważniejsze dodatki w pakietach sezonowych.
			</p>
		</div>
	)
}

export default function OfferGrid({
	title = 'NASZA OFERTA',
	initialServices = null,
}) {
	const [pricesPayload, setPricesPayload] = useState(initialServices)

	useEffect(() => {
		if (initialServices) return
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
	}, [initialServices])

	const byName = useMemo(() => {
		const map = new Map()
		for (const s of pricesPayload?.prices || []) {
			map.set(String(s.name), { id: String(s.id ?? '') })
		}
		if (!map.has('Pomoc z oponą')) map.set('Pomoc z oponą', { id: '' })
		return map
	}, [pricesPayload])

	const scrollToReservation = () => {
		document
			?.getElementById('reservation')
			?.scrollIntoView({ behavior: 'smooth', block: 'start' })
	}

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
		scrollToReservation()
	}

	const selectPackage = packageName => {
		const base =
			byName.get('Sezonowa wymiana kół') || byName.get('Wymiana opon') || {}
		const detail = {
			packageName,
			serviceName: `Pakiet sezonowy: ${packageName}`,
		}
		if (base.id) detail.serviceId = String(base.id)
		const prev = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
		localStorage.setItem(
			LS_KEY,
			JSON.stringify({
				...prev,
				serviceId: base.id || prev.serviceId || '',
				packageInterest: packageName,
			})
		)
		window.dispatchEvent(new CustomEvent('opx:service-selected', { detail }))
		scrollToReservation()
	}

	return (
		<section
			id='services'
			aria-labelledby='nasza-oferta'
			className='container-padding pt-8 flex flex-col gap-5 sm:gap-6'
		>
			<h2 id='nasza-oferta' className='title text-white'>
				{title}
			</h2>

			<ul className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 sm:items-stretch'>
				{RAW.map(s => (
					<li key={s.key} className='sm:h-full'>
						<OfferCard data={s} onSelect={selectFromCard} />
					</li>
				))}
			</ul>

			<div className='mt-3 rounded-[28px] border border-white/15 bg-white/[0.055] p-4 sm:p-6 lg:p-7'>
				<div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center'>
					<div className='max-w-3xl'>
						<span className='inline-flex rounded-full bg-secondary-orange px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-white'>
							Nowość
						</span>
						<h3 className='mt-3 text-2xl sm:text-3xl font-semibold text-white'>
							Pakiety sezonowe
						</h3>
						<p className='mt-2 max-w-2xl text-sm sm:text-base text-white/75'>
							Zrobimy wymianę pod domem albo pod pracą, bez kolejki w
							warsztacie. Pakiet dobieramy tak, żeby sezon był prostszy:
							wymiana, worki, kontakt przed kolejną zmianą i opcja pomocy w
							trasie.
						</p>
					</div>
					<PackageBenefitsPanel />
				</div>

				<div className='mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 sm:items-stretch'>
					{PACKAGES.map(pkg => (
						<PackageCard key={pkg.name} pkg={pkg} onSelect={selectPackage} />
					))}
				</div>
			</div>
		</section>
	)
}
