'use client'

import { useEffect, useMemo, useState } from 'react'
import Marquee from 'react-fast-marquee'

export default function AvailabilityBar({
	headerSelector = 'header',
	heroSelector = '#hero',
	api = '/api/availability/next?limit=12',
	speed = 30, // px/sec
	benefits = [
		'Dojazd do 60 min',
		'Bez ukrytych kosztów',
		'Płatność kartą i BLIK',
		'Gwarancja na usługę',
		'7 dni w tygodniu',
		'Obsługujemy auta i busy',
	],
}) {
	const [days, setDays] = useState({ today: null, tomorrow: null, next: null })
	const [slots, setSlots] = useState([])
	const [headerH, setHeaderH] = useState(0)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(false)

	// 1) Забираем данные один раз (без дальнейших подмен контента)
	useEffect(() => {
		let ignore = false
		;(async () => {
			try {
				setError(false)
				setLoading(true)
				const res = await fetch(api, { cache: 'no-store' })
				if (!res.ok) throw new Error(`HTTP ${res.status}`)
				const json = await res.json()
				if (!ignore) {
					setSlots(Array.isArray(json?.slots) ? json.slots : [])
					setDays(json?.days || { today: null, tomorrow: null, next: null })
				}
			} catch {
				if (!ignore) setError(true)
			} finally {
				if (!ignore) setLoading(false)
			}
		})()
		return () => {
			ignore = true
		}
	}, [api])

	// 2) sticky-отступ = высота хедера
	useEffect(() => {
		const measure = () => {
			const el = document.querySelector(headerSelector)
			setHeaderH(el ? el.getBoundingClientRect().height : 0)
		}
		measure()
		const ro = new ResizeObserver(measure)
		const el = document.querySelector(headerSelector)
		if (el) ro.observe(el)
		window.addEventListener('resize', measure)
		return () => {
			window.removeEventListener('resize', measure)
			ro.disconnect()
		}
	}, [headerSelector])

	const TimeChip = ({ t }) => (
		<strong className='text-[#FD6D02] font-semibold chip-glow'>{t}</strong>
	)

	const extractStart = (rangeStr = '') => {
		const parts = rangeStr.split(/–|-/)
		const start = parts[0]?.trim()
		return start || rangeStr
	}

	// 3) Формируем «главные» сообщения (не больше 3)
	const mainMessages = useMemo(() => {
		if (loading) return ['Sprawdzamy wolne terminy…']
		if (error) return ['Brak połączenia — spróbuj ponownie.']

		const out = []

		// A) Сегодня: точное ближайшее время
		if (days.today?.ranges?.length) {
			const firstStart = extractStart(days.today.ranges[0])
			out.push(
				<>
					🚗 Możemy przyjechać <strong>dziś</strong> o{' '}
					<TimeChip t={firstStart} />
				</>
			)
		}

		// B) Сегодня: интервалы (если есть несколько «окон»)
		if (days.today?.ranges?.length) {
			out.push(
				<>
					📍 Dziś wolne: <TimeChip t={days.today.ranges.join(', ')} />
				</>
			)
		}

		// C) Завтра: интервалы
		if (days.tomorrow?.ranges?.length) {
			out.push(
				<>
					📅 Jutro wolne: <TimeChip t={days.tomorrow.ranges.join(', ')} /> —
					zarezerwuj online
				</>
			)
		}

		// Fallback — ближайший слот из slots (например: „Śr 12.03 14:30”)
		if (
			!days.today?.ranges?.length &&
			!days.tomorrow?.ranges?.length &&
			slots.length
		) {
			const first = slots[0]
			const time = first.match(/\d{1,2}:\d{2}/)?.[0] || ''
			const label = time ? first.replace(time, '').trim() : first
			out.push(
				<>
					🕒 Najbliższy termin:{' '}
					<strong className='font-semibold'>{label}</strong>{' '}
					<TimeChip t={time} />
				</>
			)
		}

		return out.length
			? out.slice(0, 3)
			: ['Zostaw zgłoszenie — oddzwonimy w kilka minut.']
	}, [days, slots, loading, error])

	// 4) Строим один ПЛЕЙЛИСТ без дальнейших изменений:
	//    Главный → Бенефит → Главный → Бенефит → … (все бенефиты по очереди)
	const playlist = useMemo(() => {
		const mains = mainMessages.length
			? mainMessages
			: ['Zostaw zgłoszenie — oddzwonimy w kilka minut.']
		const bens = benefits.filter(Boolean)
		if (!bens.length) return mains // нет бенефитов — просто крутится список главных

		const seq = []
		let i = 0 // индекс по mains
		let j = 0 // индекс по bens

		while (j < bens.length) {
			// главный
			seq.push(
				<span key={`m-${i}-${j}`} className='inline-flex items-center gap-2'>
					{mains[i % mains.length]}
				</span>
			)
			// бенефит
			seq.push(
				<span
					key={`b-${j}`}
					className='inline-flex items-center text-white/85 font-normal'
				>
					✅ {bens[j]}
				</span>
			)
			i++
			j++
		}

		// добавим ещё один «главный» в конце (симметрии ради)
		seq.push(
			<span key={`m-end-${i}`} className='inline-flex items-center gap-2'>
				{mains[i % mains.length]}
			</span>
		)

		return seq
	}, [mainMessages, benefits])

	// 5) Рендер
	if (!playlist.length) return null

	return (
		<div
			className='w-full sticky z-[120]'
			style={{ top: headerH || 0 }}
			aria-label='Pasek dostępności'
		>
			<div className='relative bg-[#1C2E44]/90 text-white border-y border-white/15'>
				<Marquee
					pauseOnHover
					speed={speed}
					direction='left'
					gradientColor={[28, 46, 68]}
					gradientWidth={60}
					className='py-2'
				>
					{playlist.map((node, i) => (
						<span
							key={i}
							className='mx-8 text-[14px] md:text-[16px] leading-none'
						>
							{node}
						</span>
					))}
				</Marquee>
			</div>

			<style jsx>{`
				@keyframes chipGlow {
					0%,
					100% {
						text-shadow: none;
						transform: translateY(0);
					}
					50% {
						text-shadow: 0 0 8px rgba(253, 109, 2, 0.45);
						transform: translateY(-0.5px);
					}
				}
				.chip-glow {
					animation: chipGlow 2.2s ease-in-out infinite;
				}
			`}</style>
		</div>
	)
}
