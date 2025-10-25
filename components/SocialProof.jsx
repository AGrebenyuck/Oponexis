'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StarIcon } from './Icons'
import ReviewCardHero from './ReviewCardHero'

const API = '/api/google-reviews?limit=24&minRating=4'
const SS_KEY = 'gp_reviews_v1'
const SS_TTL_MS = 30 * 60 * 1000 // 30 мин кэш на клиенте

/* ---------- utils: session cache ---------- */
function readSessionCache() {
	try {
		const raw = sessionStorage.getItem(SS_KEY)
		if (!raw) return null
		const { ts, data } = JSON.parse(raw)
		if (!ts || Date.now() - ts > SS_TTL_MS) return null
		return data
	} catch {
		return null
	}
}
function writeSessionCache(data) {
	try {
		sessionStorage.setItem(SS_KEY, JSON.stringify({ ts: Date.now(), data }))
	} catch {}
}

/* ---------- hook: с SSR initialData + фоновый fetch ---------- */
function useGoogleReviews(initialData = null) {
	const [data, setData] = useState(() => initialData || null)

	// 1) если SSR нет — пробуем sessionStorage
	useEffect(() => {
		if (data) return
		const cached = typeof window !== 'undefined' ? readSessionCache() : null
		if (cached) setData(cached)
	}, [data])

	// 2) фоновая актуализация
	useEffect(() => {
		let cancel = false
		;(async () => {
			try {
				const res = await fetch(API, { cache: 'no-store' })
				const json = await res.json()
				if (!cancel && json?.ok) {
					const onlyText = (json.reviews || []).filter(
						r => (r.text || '').trim().length > 0
					)
					const normalized = {
						rating: json.rating ?? null,
						total: json.total ?? null,
						url: json.url ?? '#',
						reviews: onlyText,
					}
					setData(prev => prev || normalized) // если SSR уже показан — не дёргаем перерисовку без нужды
					writeSessionCache(normalized)
				}
			} catch {}
		})()
		return () => {
			cancel = true
		}
	}, [])

	return data
}

/* ---------- визуальные подкомпоненты ---------- */
function toneCls(tone) {
	if (tone === 'glass')
		return 'bg-white/12 text-white border border-white/25 ring-1 ring-white/10 backdrop-blur-md shadow-[0_4px_18px_rgba(0,0,0,.18)]'
	return 'bg-white text-primary-blue border border-transparent shadow-[0_6px_24px_rgba(0,0,0,.10)]'
}

function GoogleBadge({ rating, total, url, tone = 'solid', className = '' }) {
	return (
		<div
			className={`inline-flex items-center gap-3 rounded-full px-3.5 py-2 ${toneCls(
				tone
			)} ${className}`}
			style={tone === 'solid' ? { backgroundColor: '#fff' } : undefined} // гарантированно белый
		>
			<Link
				href={url || '#'}
				target='_blank'
				className='flex items-center gap-2 whitespace-nowrap'
				aria-label='Zobacz w Google'
			>
				<svg width='16' height='16' viewBox='0 0 48 48' aria-hidden>
					<path
						fill='#FFC107'
						d='M43.6 20.5H42V20H24v8h11.3C33.6 32.3 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.2 6.2 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10 0 19-7.3 19-20 0-1.2-.1-2.4-.4-3.5z'
					/>
					<path
						fill='#FF3D00'
						d='M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.2 6.2 29.4 4 24 4 16 4 9.1 8.6 6.3 14.7z'
					/>
					<path
						fill='#4CAF50'
						d='M24 44c5.1 0 9.8-1.9 13.3-5.1l-6.1-5.2C29.1 35.5 26.7 36 24 36c-5.2 0-9.6-3.7-11.2-8.6l-6.6 5.1C9.1 39.4 16 44 24 44z'
					/>
					<path
						fill='#1976D2'
						d='M43.6 20.5H42V20H24v8h11.3c-1 3-3.4 5.5-6.9 6.7l6.1 5.2C36.2 38.8 40 32.9 40 24c0-1.2-.1-2.4-.4-3.5z'
					/>
				</svg>
				<span className='flex items-center gap-1 font-extrabold leading-none text-[14px]'>
					{rating ? Number(rating).toFixed(1) : '—'}
					<StarIcon className='w-[12px] h-[12px] fill-secondary-orange' />
					<span
						className={`${
							tone === 'glass' ? 'text-white/85' : 'text-primary-blue/70'
						} text-[13px] font-medium`}
					>
						{total ? `(${total} opinii)` : ''}
					</span>
				</span>
			</Link>
		</div>
	)
}

function SkeletonPanel({ tone = 'solid', className = '' }) {
	const base =
		tone === 'solid'
			? 'bg-white'
			: 'bg-white/12 border border-white/25 ring-1 ring-white/10 backdrop-blur-md'
	return (
		<div className={`w-[300px] xl:w-[360px] ${className}`}>
			<div
				className={`inline-flex items-center gap-3 rounded-full px-3.5 py-2 ${base}`}
			>
				<div className='w-4 h-4 rounded-full bg-gray-200/70 animate-pulse' />
				<div className='h-4 w-24 bg-gray-200/70 rounded animate-pulse' />
			</div>
			<div className='relative mt-10 w-[300px] xl:w-[360px] h-[210px] xl:h-[260px]'>
				<div className='absolute inset-0 rounded-3xl bg-white/90 animate-pulse' />
			</div>
		</div>
	)
}

/* ---------- основной компонент ---------- */
/**
 * props:
 * - initialData: { rating, total, url, reviews[] } — SSR данные
 * - variant: 'panel' | 'badge'
 * - toneDesktop: 'solid' | 'glass'
 * - toneMobile: 'solid' | 'glass'
 * - showSloganDesktop, showSloganMobile: boolean
 */
export default function SocialProof({
	initialData = null,
	className = '',
	variant = 'panel',
	toneDesktop = 'glass',
	toneMobile = 'glass',
	showSloganDesktop = false,
	showSloganMobile = false,
}) {
	const data = useGoogleReviews(initialData)
	const rating = data?.rating ?? null
	const total = data?.total ?? null
	const url = data?.url ?? '#'
	const reviews = Array.isArray(data?.reviews) ? data.reviews : []

	/* только бейдж (моб) */
	if (variant === 'badge') {
		return (
			<div className={className}>
				{showSloganMobile && (
					<div className='mb-1 text-[12px] font-semibold uppercase tracking-wide text-white/90'>
						Nam ufają{' '}
						<span className='text-secondary-orange'>klienci z Opola</span>
					</div>
				)}
				{data ? (
					<GoogleBadge
						rating={rating}
						total={total}
						url={url}
						tone={toneMobile}
					/>
				) : (
					<div className='inline-flex items-center gap-3 rounded-full px-3.5 py-2 bg-white/12 border border-white/25 ring-1 ring-white/10 backdrop-blur-md'>
						<div className='w-4 h-4 rounded-full bg-white/40 animate-pulse' />
						<div className='h-4 w-28 bg-white/40 rounded animate-pulse' />
					</div>
				)}
			</div>
		)
	}

	/* панель с карточками; пауза при наведении */
	const [idx, setIdx] = useState(0)
	const intervalRef = useRef(null)

	const start = useCallback(() => {
		if (intervalRef.current) clearInterval(intervalRef.current)
		intervalRef.current = setInterval(() => {
			setIdx(i => (reviews.length ? (i + 1) % reviews.length : 0))
		}, 6000)
	}, [reviews.length])

	const stop = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current)
			intervalRef.current = null
		}
	}, [])

	useEffect(() => {
		if (!reviews.length) return
		start()
		return () => stop()
	}, [reviews.length, start, stop])

	const next = useMemo(
		() => (reviews.length ? (idx + 1) % reviews.length : 0),
		[idx, reviews.length]
	)

	const map = r => ({
		id: r.id,
		image: r.profile_photo_url || '/avatar/blank.svg',
		rate: String(r.rating ?? 5),
		name: r.author_name || 'Użytkownik Google',
		title: 'Opinia Google',
		text: r.text || '',
	})

	const cur = reviews[idx]
	const nxt = reviews[next]

	if (!data) {
		// скелетон до первого рендера
		return <SkeletonPanel tone={toneDesktop} className={className} />
	}

	return (
		<div className={`w-[300px] xl:w-[360px] ${className}`}>
			{/* верхний бейдж + слоган */}
			<div className='flex items-center gap-2 mb-4 lg:mb-10'>
				{showSloganDesktop && (
					<span
						className={`hidden lg:inline text-[13px] font-semibold uppercase tracking-wide ${
							toneDesktop === 'glass' ? 'text-white/90' : 'text-primary-blue'
						}`}
					>
						Nam ufają{' '}
						<span className='text-secondary-orange'>klienci z Opola</span>
					</span>
				)}
				<div className='ml-auto'>
					<GoogleBadge
						rating={rating}
						total={total}
						url={url}
						tone={toneDesktop}
					/>
				</div>
			</div>

			{/* карточки */}
			<div
				className='relative w-full h-[210px] xl:h-[260px]'
				onMouseEnter={stop}
				onMouseLeave={start}
			>
				<AnimatePresence mode='popLayout'>
					{nxt && (
						<motion.div
							key={`shadow-${nxt.id}`}
							className='absolute -top-8 left-8 w-full scale-[0.9] z-0'
							initial={{ opacity: 0, scale: 0.86 }}
							animate={{ opacity: 1, scale: 0.9 }}
							exit={{ opacity: 0, scale: 0.86 }}
							transition={{ duration: 0.45 }}
						>
							<ReviewCardHero
								review={map(nxt)}
								compact
								shadow='light'
								textSize='sm'
							/>
						</motion.div>
					)}
					{cur ? (
						<motion.div
							key={cur.id}
							className='relative z-10'
							initial={{ opacity: 0, y: 14 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -14 }}
							transition={{ duration: 0.45 }}
						>
							<ReviewCardHero
								review={map(cur)}
								compact
								shadow='strong'
								textSize='sm'
							/>
						</motion.div>
					) : (
						<div className='w-full h-full rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md' />
					)}
				</AnimatePresence>
			</div>
		</div>
	)
}
