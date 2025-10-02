// components/MultiServicePicker.jsx
'use client'

import Select, { SelectOption } from '@/components/ui/select'
import { useMemo } from 'react'

/**
 * Иерархический мультиселект:
 * - можно выбрать родителя и/или подопции
 * - выбор подопции добавляет родителя
 * - снятие родителя снимает всех подопций
 *
 * props:
 * - services: [{ id, name, price, additionalServices?: [{ id, name, price }] }]
 * - value: string[]
 * - onChange: (ids: string[]) => void
 * - placeholder?: string
 * - label?: string
 * - dropdownPosition?: 'top' | 'bottom'
 * - className?: string
 */
export default function MultiServicePicker({
	services = [],
	value = [],
	onChange,
	placeholder = 'Wybierz usługę…',
	label = 'Usługa',
	dropdownPosition = 'top',
	className = '',
}) {
	const maps = useMemo(() => {
		const childToParent = new Map()
		for (const s of services) {
			const pid = String(s.id ?? '')
			for (const sub of s.additionalServices || []) {
				childToParent.set(String(sub.id ?? ''), pid)
			}
		}
		return { childToParent }
	}, [services])

	function enforceRules(nextIdsRaw) {
		let next = Array.from(new Set((nextIdsRaw || []).map(String)))
		// (1) дочерний → добавить родителя
		for (const id of next) {
			const p = maps.childToParent.get(id)
			if (p && !next.includes(p)) next.push(p)
		}
		// (2) если родителя нет — дети снимаются
		const setNext = new Set(next)
		next = next.filter(id => {
			const p = maps.childToParent.get(id)
			return !p || setNext.has(p)
		})
		return Array.from(new Set(next))
	}

	const handleChange = nextIds => {
		onChange?.(enforceRules(nextIds))
	}

	return (
		<div className={`w-full ${className}`}>
			{label ? (
				<label className='block text-white/85 text-sm mb-1'>{label}</label>
			) : null}

			{/* стеклянная рамка совпадает с остальными инпутами */}
			<div className='rounded-xl bg-white/10 border border-white/30'>
				<Select
					multiple
					value={(value || []).map(String)}
					onChange={handleChange}
					placeholder={placeholder}
					position={dropdownPosition}
					triggerClassName='min-h-[48px] md:min-h-[52px] py-0'
				>
					{services.map((s, idx) => {
						const pid = String(s.id ?? `svc-${idx}`)
						const subOptions = (s.additionalServices || []).map((sub, i) => ({
							value: String(sub.id ?? `${pid}-sub-${i}`),
							label: sub.name,
							price: sub.price,
						}))
						return (
							<SelectOption
								key={`svc-${pid}`}
								value={pid}
								subOptions={subOptions}
							>
								{/* ВАЖНО: первым ребёнком — сырой текст (для чипа/лейбла) */}
								{String(s.name)}
								<span className='ml-auto opacity-70'>{s.price} zł</span>
							</SelectOption>
						)
					})}
				</Select>
			</div>
		</div>
	)
}
