// components/OrderForm.jsx
'use client'

import { useState } from 'react'
import MultiServicePicker from './ui/MultiServicePicker'
import OrderAddressInput from './ui/OrderAddressInput'

export default function OrderForm({
	initialData,
	services,
	visitDate,
	visitTime,
	onSuccess,
}) {
	// попытка найти услугу из текста, если пришла из ссылки
	function resolveServiceIds(serviceName) {
		if (!serviceName) return []
		const norm = serviceName.trim().toLowerCase()

		for (const s of services) {
			if (s.name.trim().toLowerCase() === norm) return [String(s.id)]
			for (const sub of s.additionalServices || []) {
				if (sub.name.trim().toLowerCase() === norm) {
					return [String(s.id), String(sub.id)]
				}
			}
		}
		return []
	}

	const [form, setForm] = useState({
		leadId: initialData.leadId,
		name: initialData.name || '',
		phone: initialData.phone || '',
		serviceIds: resolveServiceIds(initialData.service),
		regNumber: '',
		color: '',
		carModel: '',
		address: '',
		lat: null,
		lng: null,
		notes: '',
	})

	const [errors, setErrors] = useState({
		name: '',
		phone: '',
		service: '',
		regNumber: '',
		address: '',
		form: '',
	})

	const [loading, setLoading] = useState(false)

	function handleChange(e) {
		const { name, value } = e.target

		if (name === 'regNumber') {
			const upper = value.toUpperCase()
			setForm(prev => ({ ...prev, regNumber: upper }))
			if (upper.trim()) {
				setErrors(prev => ({ ...prev, regNumber: '' }))
			}
			return
		}

		setForm(prev => ({ ...prev, [name]: value }))
		if (errors[name]) {
			setErrors(prev => ({ ...prev, [name]: '' }))
		}
	}

	// 🔥 важное место: ручной ввод vs карта
	function handleAddressChange(value) {
		// если строка — это ручной ввод → сбрасываем lat/lng
		if (typeof value === 'string') {
			setForm(prev => ({
				...prev,
				address: value,
				lat: null,
				lng: null,
			}))
			if (value.trim()) {
				setErrors(prev => ({ ...prev, address: '' }))
			}
			return
		}

		// если объект — пришло с карты
		if (value && typeof value === 'object') {
			setForm(prev => ({
				...prev,
				address: value.address || '',
				lat: value.lat ?? null,
				lng: value.lng ?? null,
			}))
			if ((value.address || '').trim()) {
				setErrors(prev => ({ ...prev, address: '' }))
			}
		}
	}

	// мапа id → имена всех выбранных услуг
	function buildServiceNameFromIds(ids) {
		if (!Array.isArray(ids) || !ids.length) return ''

		const idToName = new Map()
		services.forEach(s => {
			if (s.id != null) idToName.set(String(s.id), s.name)
			;(s.additionalServices || []).forEach(sub => {
				if (sub.id != null) idToName.set(String(sub.id), sub.name)
			})
		})

		const names = ids.map(id => idToName.get(String(id))).filter(Boolean)

		// убираем дубли (когда выбран родитель и подуслуга)
		const uniq = Array.from(new Set(names))

		return uniq.join(' + ')
	}

	async function handleSubmit(e) {
		e.preventDefault()

		setErrors({
			name: '',
			phone: '',
			service: '',
			regNumber: '',
			address: '',
			form: '',
		})

		let hasError = false

		if (!form.name.trim()) {
			hasError = true
			setErrors(prev => ({ ...prev, name: 'Prosimy podać imię.' }))
		}

		if (!form.phone.trim()) {
			hasError = true
			setErrors(prev => ({
				...prev,
				phone: 'Prosimy podać numer telefonu.',
			}))
		}

		if (!form.serviceIds.length) {
			hasError = true
			setErrors(prev => ({
				...prev,
				service: 'Prosimy wybrać usługę.',
			}))
		}

		if (!form.regNumber.trim()) {
			hasError = true
			setErrors(prev => ({
				...prev,
				regNumber: 'Prosimy podać numer rejestracyjny.',
			}))
		}

		if (!form.address.trim()) {
			hasError = true
			setErrors(prev => ({
				...prev,
				address: 'Prosimy podać adres.',
			}))
		}

		if (hasError) return

		setLoading(true)
		try {
			const serviceName = buildServiceNameFromIds(form.serviceIds)

			const payload = {
				...form,
				service: serviceName || null,
				visitDate: visitDate || null,
				visitTime: visitTime || null,
			}

			const res = await fetch('/api/order/client', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})

			const json = await res.json()
			if (!json.ok) throw new Error(json.error || 'Błąd serwera')

			onSuccess?.()
		} catch (err) {
			console.error(err)
			setErrors(prev => ({ ...prev, form: err.message || 'Błąd serwera' }))
		} finally {
			setLoading(false)
		}
	}

	return (
		<form onSubmit={handleSubmit} className='space-y-4 mt-4'>
			{/* Imię */}
			<div className='space-y-1'>
				<label className='text-xs text-slate-400'>
					Imię <span className='text-red-400'>*</span>
				</label>
				<input
					name='name'
					value={form.name}
					onChange={handleChange}
					placeholder='Np. Piotr'
					className={`w-full rounded-lg px-3 py-2 text-sm bg-slate-800/80 border ${
						errors.name ? 'border-red-500' : 'border-slate-700'
					} text-slate-100`}
				/>
				{errors.name && <p className='text-xs text-red-400'>{errors.name}</p>}
			</div>

			{/* Telefon */}
			<div className='space-y-1'>
				<label className='text-xs text-slate-400'>
					Telefon <span className='text-red-400'>*</span>
				</label>
				<input
					name='phone'
					value={form.phone}
					onChange={handleChange}
					placeholder='Np. +48111111111'
					className={`w-full rounded-lg px-3 py-2 text-sm bg-slate-800/80 border ${
						errors.phone ? 'border-red-500' : 'border-slate-700'
					} text-slate-100`}
				/>
				{errors.phone && <p className='text-xs text-red-400'>{errors.phone}</p>}
			</div>

			{/* Usługa */}
			<div className='space-y-1'>
				<MultiServicePicker
					services={services}
					value={form.serviceIds}
					onChange={v => {
						setForm(prev => ({ ...prev, serviceIds: v }))
						if (v.length) {
							setErrors(prev => ({ ...prev, service: '' }))
						}
					}}
					placeholder='Wybierz usługę…'
					label='Usługa'
					variant='order'
					dropdownPosition='bottom'
				/>
				{errors.service && (
					<p className='text-xs text-red-400'>{errors.service}</p>
				)}
			</div>

			{/* Adres */}
			<div className='space-y-1'>
				<label className='text-xs text-slate-400'>
					Adres(ulica, numer, miejscowość){' '}
					<span className='text-red-400'>*</span>
				</label>
				<OrderAddressInput
					value={form.address}
					onChange={handleAddressChange}
					error={errors.address}
				/>
			</div>

			{/* Numer rejestracyjny */}
			<div className='space-y-1'>
				<label className='text-xs text-slate-400'>
					Numer rejestracyjny <span className='text-red-400'>*</span>
				</label>
				<input
					name='regNumber'
					value={form.regNumber}
					onChange={handleChange}
					placeholder='Np. OP 12345'
					className={`w-full rounded-lg px-3 py-2 text-sm bg-slate-800/80 border ${
						errors.regNumber ? 'border-red-500' : 'border-slate-700'
					} text-slate-100`}
				/>
				{errors.regNumber && (
					<p className='text-xs text-red-400'>{errors.regNumber}</p>
				)}
			</div>

			{/* Kolor + Model */}
			<div className='grid grid-cols-2 gap-3'>
				<div className='space-y-1'>
					<label className='text-xs text-slate-400'>Kolor auta</label>
					<input
						name='color'
						value={form.color}
						onChange={handleChange}
						placeholder='Np. czarny'
						className='w-full rounded-lg px-3 py-2 text-sm bg-slate-800/80 border border-slate-700 text-slate-100'
					/>
				</div>

				<div className='space-y-1'>
					<label className='text-xs text-slate-400'>Model</label>
					<input
						name='carModel'
						value={form.carModel}
						onChange={handleChange}
						placeholder='Np. Audi A4'
						className='w-full rounded-lg px-3 py-2 text-sm bg-slate-800/80 border border-slate-700 text-slate-100'
					/>
				</div>
			</div>

			{/* Uwagi */}
			<div className='space-y-1'>
				<label className='text-xs text-slate-400'>Uwagi (opcjonalnie)</label>
				<textarea
					name='notes'
					value={form.notes}
					onChange={handleChange}
					placeholder='Np. garaż podziemny, niski prześwit, itp.'
					rows={3}
					className='w-full rounded-lg px-3 py-2 text-sm bg-slate-800/80 border border-slate-700 text-slate-100 resize-none'
				/>
			</div>

			{errors.form && <p className='text-xs text-red-400'>{errors.form}</p>}

			<button
				type='submit'
				disabled={loading}
				className='w-full inline-flex items-center justify-center rounded-lg bg-orange-500 hover:bg-orange-600 py-2.5 text-sm font-medium disabled:opacity-60'
			>
				{loading ? 'Wysyłanie…' : 'Wyślij dane'}
			</button>
		</form>
	)
}
