'use client'

import { useState } from 'react'
import MultiServicePicker from './ui/MultiServicePicker'
import OrderAddressInput from './ui/OrderAddressInput'

import { crmFetch } from '@/lib/crm'
import { getDetailsContent } from './serviceDetails' // 🔹 подключаем хелпер
import Popover from './ui/popover'

const RIM_SIZES = Array.from({ length: 10 }, (_, i) => `R${13 + i}`)

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
		const names = String(serviceName)
			.split(/\s*(?:,|\+|;|\n)\s*/)
			.map(name => name.trim().toLowerCase())
			.filter(Boolean)

		if (!names.length) return []

		const ids = []
		const pushId = id => {
			const value = String(id)
			if (!ids.includes(value)) ids.push(value)
		}

		for (const norm of names) {
			for (const service of services) {
				if (service.name.trim().toLowerCase() === norm) {
					pushId(service.id)
					break
				}

				const sub = (service.additionalServices || []).find(
					item => item.name.trim().toLowerCase() === norm
				)

				if (sub) {
					pushId(service.id)
					pushId(sub.id)
					break
				}
			}
		}

		return ids
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

		// 🔹 koła / opony
		wheelRimSize: '',
		tireSize: '',

		// 🔹 фактура
		wantsInvoice: false,
		invoiceNip: '',
		invoiceEmail: '',
	})

	const [errors, setErrors] = useState({
		name: '',
		phone: '',
		service: '',
		regNumber: '',
		address: '',
		wheelRimSize: '',
		form: '',
		invoiceNip: '',
		invoiceEmail: '',
	})

	const [loading, setLoading] = useState(false)

	function handleChange(e) {
		const { name, value, type, checked } = e.target

		if (name === 'regNumber') {
			const upper = value.toUpperCase()
			setForm(prev => ({ ...prev, regNumber: upper }))
			if (upper.trim()) {
				setErrors(prev => ({ ...prev, regNumber: '' }))
			}
			return
		}

		if (type === 'checkbox') {
			setForm(prev => ({ ...prev, [name]: checked }))
			if (!checked && name === 'wantsInvoice') {
				setForm(prev => ({
					...prev,
					invoiceNip: '',
					invoiceEmail: '',
				}))
				setErrors(prev => ({
					...prev,
					invoiceNip: '',
					invoiceEmail: '',
				}))
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
		const uniq = Array.from(new Set(names))
		return uniq.join(' + ')
	}

	// список имён выбранных услуг
	function getSelectedServiceNames(ids) {
		if (!Array.isArray(ids) || !ids.length) return []

		const idToName = new Map()
		services.forEach(s => {
			if (s.id != null) idToName.set(String(s.id), s.name)
			;(s.additionalServices || []).forEach(sub => {
				if (sub.id != null) idToName.set(String(sub.id), sub.name)
			})
		})

		const names = ids.map(id => idToName.get(String(id))).filter(Boolean)
		return Array.from(new Set(names))
	}

	const selectedNames = getSelectedServiceNames(form.serviceIds)

	// 🔹 собираем контент из хелпера для ВСЕХ выбранных услуг
	const selectedDetails = selectedNames
		.map(name => ({
			name,
			content: getDetailsContent(name),
		}))
		.filter(item => item.content)

	async function handleSubmit(e) {
		e.preventDefault()

		setErrors({
			name: '',
			phone: '',
			service: '',
			regNumber: '',
			address: '',
			wheelRimSize: '',
			form: '',
			invoiceNip: '',
			invoiceEmail: '',
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

		if (!form.wheelRimSize.trim()) {
			hasError = true
			setErrors(prev => ({
				...prev,
				wheelRimSize: 'Prosimy wybrać rozmiar felgi.',
			}))
		}

		// валидация фактуры
		if (form.wantsInvoice) {
			if (!form.invoiceNip.trim()) {
				hasError = true
				setErrors(prev => ({
					...prev,
					invoiceNip: 'Prosimy podać NIP do faktury.',
				}))
			}
			if (!form.invoiceEmail.trim()) {
				hasError = true
				setErrors(prev => ({
					...prev,
					invoiceEmail: 'Prosimy podać e-mail do faktury.',
				}))
			} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.invoiceEmail.trim())) {
				hasError = true
				setErrors(prev => ({
					...prev,
					invoiceEmail: 'Podaj poprawny adres e-mail.',
				}))
			}
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

			const res = await crmFetch('/api/public/order/client', {
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
					label=<>
						<p>
							Usługa <span className='text-red-400'>*</span>
						</p>
					</>
					variant='order'
					dropdownPosition='bottom'
				/>
				{errors.service && (
					<p className='text-xs text-red-400'>{errors.service}</p>
				)}

				{/* 🔹 Кнопка Szczegóły только если хотя бы одна выбранная услуга поддерживается хелпером */}
				{selectedDetails.length > 0 && (
					<div className='text-[11px] text-slate-400 pt-1'>
						<Popover
							placement='bottom'
							arrow
							content={
								<div className='space-y-3'>
									{selectedDetails.map(item => (
										<div key={item.name}>{item.content}</div>
									))}
								</div>
							}
						>
							<button
								type='button'
								className='underline underline-offset-2 decoration-slate-500 hover:text-slate-200'
							>
								Szczegóły wybranych usług
							</button>
						</Popover>
					</div>
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

			{/* Rozmiar felgi + opony */}
			<div className='space-y-3 rounded-xl border border-slate-800/70 bg-slate-900/35 p-3'>
				<div className='flex items-start justify-between gap-3'>
					<div>
						<p className='text-xs font-medium text-slate-300'>Dane opony</p>
						<p className='text-[11px] text-slate-500'>
							Pomaga nam dobrać sprzęt i przygotować wizytę.
						</p>
					</div>

					<Popover
						placement='bottom'
						arrow
						content={
							<div className='space-y-3 text-xs sm:text-[13px]'>
								<div>
									<h4 className='font-semibold text-secondary-orange mb-1'>
										Gdzie znaleźć rozmiar opony?
									</h4>
									<p className='text-white/90'>
										Rozmiar znajduje się na boku opony. Najczęściej wygląda tak:
									</p>
								</div>

								<div className='rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-center font-semibold tracking-wide text-white'>
									205/55 R16
								</div>

								<ul className='list-disc list-inside space-y-1 text-white/90'>
									<li>
										<b>R16</b> to średnica felgi — wybierz go w formularzu.
									</li>
									<li>
										<b>205/55</b> to rozmiar opony — możesz go wpisać, jeśli
										znasz.
									</li>
								</ul>
							</div>
						}
					>
						<button
							type='button'
							className='text-[11px] underline underline-offset-2 decoration-slate-500 text-slate-400 hover:text-slate-200 whitespace-nowrap'
						>
							Gdzie to znaleźć?
						</button>
					</Popover>
				</div>

				<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
					<div className='space-y-1'>
						<label className='text-xs text-slate-400'>
							Średnica felgi <span className='text-red-400'>*</span>
						</label>
						<select
							name='wheelRimSize'
							value={form.wheelRimSize}
							onChange={handleChange}
							className={`w-full rounded-lg px-3 py-2 text-sm bg-slate-800/80 border ${
								errors.wheelRimSize ? 'border-red-500' : 'border-slate-700'
							} text-slate-100`}
						>
							<option value=''>Wybierz</option>
							{RIM_SIZES.map(size => (
								<option key={size} value={size}>
									{size}
								</option>
							))}
						</select>
						{errors.wheelRimSize && (
							<p className='text-xs text-red-400'>{errors.wheelRimSize}</p>
						)}
					</div>

					<div className='space-y-1'>
						<label className='text-xs text-slate-400'>
							Rozmiar opony{' '}
							<span className='text-slate-500'>(opcjonalnie)</span>
						</label>
						<input
							name='tireSize'
							value={form.tireSize}
							onChange={handleChange}
							placeholder='Np. 205/55'
							className='w-full rounded-lg px-3 py-2 text-sm bg-slate-800/80 border border-slate-700 text-slate-100'
						/>
					</div>
				</div>
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

			{/* Faktura VAT */}
			<div className='space-y-2 pt-1 border-t border-slate-800/60'>
				<label className='flex items-center gap-2 text-xs text-slate-300'>
					<input
						type='checkbox'
						name='wantsInvoice'
						checked={form.wantsInvoice}
						onChange={handleChange}
						className='h-4 w-4 rounded border-slate-600 bg-slate-800'
					/>
					<span>Chcę otrzymać fakturę za usługę</span>
				</label>

				{form.wantsInvoice && (
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1'>
						<div className='space-y-1'>
							<label className='text-xs text-slate-400'>
								NIP <span className='text-red-400'>*</span>
							</label>
							<input
								name='invoiceNip'
								value={form.invoiceNip}
								onChange={handleChange}
								placeholder='Np. 1234567890'
								className={`w-full rounded-lg px-3 py-2 text-sm bg-slate-800/80 border ${
									errors.invoiceNip ? 'border-red-500' : 'border-slate-700'
								} text-slate-100`}
							/>
							{errors.invoiceNip && (
								<p className='text-xs text-red-400'>{errors.invoiceNip}</p>
							)}
						</div>

						<div className='space-y-1'>
							<label className='text-xs text-slate-400'>
								E-mail do faktury <span className='text-red-400'>*</span>
							</label>
							<input
								name='invoiceEmail'
								value={form.invoiceEmail}
								onChange={handleChange}
								placeholder='Np. firma@domena.pl'
								className={`w-full rounded-lg px-3 py-2 text-sm bg-slate-800/80 border ${
									errors.invoiceEmail ? 'border-red-500' : 'border-slate-700'
								} text-slate-100`}
							/>
							{errors.invoiceEmail && (
								<p className='text-xs text-red-400'>{errors.invoiceEmail}</p>
							)}
						</div>
					</div>
				)}
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
