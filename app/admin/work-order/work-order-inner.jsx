'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function WorkOrderEditInner() {
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
			const res = await fetch(`/api/work-orders/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form),
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
					{/* ...оставляем всю форму как у тебя */}
				</form>
			</div>
		</div>
	)
}
