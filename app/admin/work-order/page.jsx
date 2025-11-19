// app/admin/work-order/page.jsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function WorkOrderEditPage() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const id = searchParams.get('id')

	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')

	const [form, setForm] = useState({
		name: '',
		phone: '',
		service: '',
		regNumber: '',
		color: '',
		carModel: '',
		address: '',
		notes: '',
		visitDate: '',
		visitTime: '',
	})

	useEffect(() => {
		if (!id) {
			setError('Brak parametru "id" w adresie.')
			setLoading(false)
			return
		}

		async function loadOrder() {
			try {
				setLoading(true)
				const res = await fetch(`/api/work-orders/${id}`)
				const json = await res.json()

				if (!res.ok || !json.ok) {
					throw new Error(json.error || 'Nie udało się pobrać zlecenia.')
				}

				const o = json.order

				setForm({
					name: o.name || '',
					phone: o.phone || '',
					service: o.service || '',
					regNumber: o.regNumber || '',
					color: o.color || '',
					carModel: o.carModel || '',
					address: o.address || '',
					notes: o.notes || '',
					visitDate: o.visitDate
						? new Date(o.visitDate).toISOString().slice(0, 10)
						: '',
					visitTime: o.visitTime || '',
				})
				setError('')
			} catch (e) {
				console.error(e)
				setError(e.message || 'Błąd podczas ładowania zlecenia.')
			} finally {
				setLoading(false)
			}
		}

		loadOrder()
	}, [id])

	function handleChange(e) {
		const { name, value } = e.target
		setForm(prev => ({ ...prev, [name]: value }))
		setError('')
		setSuccess('')
	}

	async function handleSubmit(e) {
		e.preventDefault()
		if (!id) return

		setSaving(true)
		setError('')
		setSuccess('')

		try {
			const payload = {
				...form,
			}

			const res = await fetch(`/api/work-orders/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})

			const json = await res.json()

			if (!res.ok || !json.ok) {
				throw new Error(json.error || 'Nie udało się zapisać zmian.')
			}

			setSuccess('Zapisano zmiany. Grafik został zaktualizowany.')
		} catch (e) {
			console.error(e)
			setError(e.message || 'Błąd podczas zapisywania zmian.')
		} finally {
			setSaving(false)
		}
	}

	if (!id) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 px-4'>
				<div className='max-w-md text-center'>
					<h1 className='text-lg font-semibold mb-2'>Brak ID zlecenia</h1>
					<p className='text-sm text-slate-400'>
						Adres powinien zawierać parametr <code>?id=...</code>.
					</p>
				</div>
			</div>
		)
	}

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-slate-900 text-slate-100'>
				<p className='text-sm text-slate-300'>Ładowanie zlecenia…</p>
			</div>
		)
	}

	return (
		<div className='min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 px-4 py-8'>
			<div className='w-full max-w-xl bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl'>
				<div className='flex items-center justify-between mb-4'>
					<h1 className='text-lg font-semibold'>Edytuj zlecenie</h1>
					<button
						type='button'
						onClick={() => router.back()}
						className='text-xs text-slate-400 hover:text-slate-200'
					>
						← Wróć
					</button>
				</div>

				<form onSubmit={handleSubmit} className='space-y-4'>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
						<div className='space-y-1'>
							<label className='text-xs text-slate-300'>Imię</label>
							<input
								name='name'
								value={form.name}
								onChange={handleChange}
								className='w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100'
							/>
						</div>

						<div className='space-y-1'>
							<label className='text-xs text-slate-300'>Telefon</label>
							<input
								name='phone'
								value={form.phone}
								onChange={handleChange}
								className='w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100'
							/>
						</div>
					</div>

					<div className='space-y-1'>
						<label className='text-xs text-slate-300'>Usługa</label>
						<input
							name='service'
							value={form.service}
							onChange={handleChange}
							className='w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100'
						/>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
						<div className='space-y-1'>
							<label className='text-xs text-slate-300'>Data wizyty</label>
							<input
								type='date'
								name='visitDate'
								value={form.visitDate}
								onChange={handleChange}
								className='w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100'
							/>
						</div>

						<div className='space-y-1'>
							<label className='text-xs text-slate-300'>Godzina wizyty</label>
							<input
								type='time'
								name='visitTime'
								value={form.visitTime}
								onChange={handleChange}
								className='w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100'
							/>
						</div>
					</div>

					<div className='space-y-1'>
						<label className='text-xs text-slate-300'>Adres</label>
						<input
							name='address'
							value={form.address}
							onChange={handleChange}
							className='w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100'
						/>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
						<div className='space-y-1'>
							<label className='text-xs text-slate-300'>
								Numer rejestracyjny
							</label>
							<input
								name='regNumber'
								value={form.regNumber}
								onChange={handleChange}
								className='w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100'
							/>
						</div>

						<div className='space-y-1'>
							<label className='text-xs text-slate-300'>Kolor auta</label>
							<input
								name='color'
								value={form.color}
								onChange={handleChange}
								className='w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100'
							/>
						</div>
					</div>

					<div className='space-y-1'>
						<label className='text-xs text-slate-300'>Model auta</label>
						<input
							name='carModel'
							value={form.carModel}
							onChange={handleChange}
							className='w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100'
						/>
					</div>

					<div className='space-y-1'>
						<label className='text-xs text-slate-300'>Uwagi</label>
						<textarea
							name='notes'
							value={form.notes}
							onChange={handleChange}
							rows={3}
							className='w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 resize-none'
						/>
					</div>

					{error && <p className='text-xs text-red-400'>{error}</p>}
					{success && <p className='text-xs text-emerald-400'>{success}</p>}

					<button
						type='submit'
						disabled={saving}
						className='w-full inline-flex items-center justify-center rounded-lg bg-orange-500 hover:bg-orange-600 text-sm font-medium py-2.5 disabled:opacity-60'
					>
						{saving ? 'Zapisywanie…' : 'Zapisz zmiany'}
					</button>
				</form>
			</div>
		</div>
	)
}
