// components/AvailabilityBar.jsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Marquee from 'react-fast-marquee'

/* =========================
   Конфиг по умолчанию
   ========================= */
const DEFAULT_BENEFITS = [
	'Darmowy dojazd',
	'Cena jak w warsztacie',
	'Płatność kartą i BLIK',
	'Gwarancja na usługę',
	'7 dni w tygodniu',
]

const DEFAULT_SURCHARGES = {
	weekdays: { pct: 30, window: '12:00–20:00', label: 'Dni rob.' },
	weekends: { pct: 50, window: '12:00–20:00', label: 'Weekendy' },
	sundays: { pct: 50, label: 'Niedziela' },
}

/* =========================
   Хелперы (чистые функции)
   ========================= */
function extractStart(rangeStr = '') {
	const parts = rangeStr.split(/–|-/)
	const start = parts[0]?.trim()
	return start || rangeStr
}

// === Вспомогательная функция: красит время в оранжевый ===
function highlightTime(str) {
	// если выходной — ничего не красим
	const lowered = str.toLowerCase()
	if (
		lowered.includes('sob') ||
		lowered.includes('niedz') ||
		lowered.includes('dni rob') ||
		lowered.includes('weekend')
	) {
		return str
	}

	// ищем время формата 09:00, 9:30, 14:05
	return str.replace(
		/(\b\d{1,2}:\d{2}\b)/g,
		'<span class="text-secondary-orange font-semibold">$1</span>'
	)
}

function buildMainMessages(days, slots) {
	const out = []

	// dziś — ближайшее время
	if (Array.isArray(days?.today?.ranges) && days.today.ranges.length) {
		const firstStart = extractStart(days.today.ranges[0])
		out.push({
			type: 'info',
			text: `🚗 Możemy przyjechać dziś o ${firstStart}`,
		})
		out.push({
			type: 'info',
			text: `📍 Dziś wolne: ${days.today.ranges.join(', ')}`,
		})
	}

	// jutro — интервалы
	if (Array.isArray(days?.tomorrow?.ranges) && days.tomorrow.ranges.length) {
		out.push({
			type: 'info',
			text: `📅 Jutro wolne: ${days.tomorrow.ranges.join(
				', '
			)} — zarezerwuj online`,
		})
	}

	// Fallback — первый слот из slots
	if (
		(!days?.today?.ranges || !days.today.ranges.length) &&
		(!days?.tomorrow?.ranges || !days.tomorrow.ranges.length) &&
		Array.isArray(slots) &&
		slots.length
	) {
		const first = slots[0]
		const time = first.match(/\d{1,2}:\d{2}/)?.[0] || ''
		const label = time ? first.replace(time, '').trim() : first
		const text = time
			? `🕒 Najbliższy termin: ${label} ${time}`
			: `🕒 Najbliższy termin: ${label}`
		out.push({ type: 'info', text })
	}

	if (!out.length) {
		out.push({
			type: 'info',
			text: 'Zostaw zgłoszenie — oddzwonimy w kilka minut.',
		})
	}

	return out.slice(0, 3)
}

function buildSurchargeMessages(surcharges, enabled) {
	if (!enabled || !surcharges) return []
	const items = []

	if (surcharges.weekdays?.pct && surcharges.weekdays?.window) {
		const { pct, window, label = 'Dni rob.' } = surcharges.weekdays
		items.push({
			type: 'alert',
			text: `⚠️ ${label}: cena +${pct}% poza ${window}`,
		})
	}
	if (surcharges.weekends?.pct && surcharges.weekends?.window) {
		const { pct, window, label = 'Weekendy' } = surcharges.weekends
		items.push({
			type: 'alert',
			text: `⚠️ ${label}: cena +${pct}% poza ${window}`,
		})
	}
	if (surcharges.sundays?.pct) {
		const { pct, label = 'Niedziela' } = surcharges.sundays
		items.push({
			type: 'alert',
			text: `⚠️ ${label}: cena +${pct}% niezależnie od godziny`,
		})
	}

	return items
}

/** Вставляет элементы массива `alerts` в массив `seq` с шагом `cadence`. */
function interleave(seq, alerts, cadence = 2) {
	if (!alerts?.length || cadence < 1) return seq
	const out = []
	let a = 0
	let since = cadence
	for (let i = 0; i < seq.length; i++) {
		out.push(seq[i])
		if (since >= cadence && a < alerts.length) {
			out.push(alerts[a++])
			since = 0
		} else {
			since++
		}
	}
	return out
}

/* =========================
   Компонент
   ========================= */
export default function AvailabilityBar({
	headerSelector = 'header',
	api = '/api/availability/next?limit=12',
	speed = 30, // px/sec
	benefits = DEFAULT_BENEFITS,
	showSurcharges = true,
	surcharges = DEFAULT_SURCHARGES,
	cadence = 2, // как часто «вмешивать» сообщения о доплатах среди бенефитов
	showAvailability = false,
}) {
	const [days, setDays] = useState({ today: null, tomorrow: null, next: null })
	const [slots, setSlots] = useState([])
	const [headerH, setHeaderH] = useState(0)
	const [state, setState] = useState({ loading: true, error: false })

	// ---- load once
	useEffect(() => {
		if (!showAvailability) {
			setSlots([])
			setDays({ today: null, tomorrow: null, next: null })
			setState({ loading: false, error: false })
			return
		}

		const ac = new AbortController()

		;(async () => {
			try {
				setState({ loading: true, error: false })

				const res = await fetch(api, {
					cache: 'no-store',
					signal: ac.signal,
				})

				if (!res.ok) throw new Error(`HTTP ${res.status}`)

				const json = await res.json()

				setSlots(Array.isArray(json?.slots) ? json.slots : [])
				setDays(json?.days || { today: null, tomorrow: null, next: null })
				setState({ loading: false, error: false })
			} catch (e) {
				if (ac.signal.aborted) return
				setState({ loading: false, error: true })
			}
		})()

		return () => ac.abort()
	}, [api, showAvailability])

	// ---- sticky offset
	const headerRef = useRef(null)
	useEffect(() => {
		const el = document.querySelector(headerSelector)
		headerRef.current = el
		const measure = () => setHeaderH(el ? el.getBoundingClientRect().height : 0)
		measure()
		const ro = el ? new ResizeObserver(measure) : null
		if (el && ro) ro.observe(el)
		window.addEventListener('resize', measure)
		return () => {
			window.removeEventListener('resize', measure)
			ro?.disconnect()
		}
	}, [headerSelector])

	// ---- данные → сообщения
	const playlist = useMemo(() => {
		const mains = showAvailability
			? state.loading
				? [{ type: 'info', text: 'Sprawdzamy wolne terminy…' }]
				: state.error
				? [{ type: 'info', text: 'Brak połączenia — spróbuj ponownie.' }]
				: buildMainMessages(days, slots)
			: []

		const bens = (benefits || [])
			.filter(Boolean)
			.map(t => ({ type: 'benefit', text: `✅ ${t}` }))
		if (!bens.length) return mains

		// основной паттерн: MAIN → BENEFIT → MAIN → BENEFIT …
		const seq = []
		const len = Math.max(mains.length, bens.length)
		for (let i = 0; i < len; i++) {
			if (i < mains.length) seq.push(mains[i])
			if (i < bens.length) seq.push(bens[i])
		}

		// аккуратно «вмешиваем» доплаты
		const alerts = buildSurchargeMessages(surcharges, showSurcharges)
		return interleave(seq, alerts, cadence)
	}, [
		state,
		days,
		slots,
		benefits,
		surcharges,
		showSurcharges,
		cadence,
		showAvailability,
	])

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
					{playlist.map((item, i) => (
						<span
							key={`${item.type}-${i}`}
							className={
								item.type === 'alert'
									? 'mx-8 text-[14px] md:text-[16px] leading-none text-white font-medium'
									: 'mx-8 text-[14px] md:text-[16px] leading-none text-white/90'
							}
							dangerouslySetInnerHTML={{ __html: highlightTime(item.text) }}
						/>
					))}
				</Marquee>
			</div>

			{/* невзламываемый, лаконичный эффект для «часов» */}
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
