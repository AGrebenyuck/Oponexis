'use client'

import { useEffect, useMemo, useState } from 'react'

function ZL({ value }) {
	return <>{Number(value || 0).toFixed(2)}&nbsp;zł</>
}

export default function PartnerStats({ code }) {
	const [data, setData] = useState(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const [months, setMonths] = useState(3) // по умолчанию 6 мес
	const DAYS_WINDOW = 30 // последние 30 дней в daily

	async function load() {
		setLoading(true)
		setError(null)
		try {
			const res = await fetch(
				`/api/partners/${code}/stats?months=${months}&days=${DAYS_WINDOW}`,
				{
					cache: 'no-store',
				}
			)
			if (!res.ok) throw new Error(`HTTP ${res.status}`)
			const json = await res.json()
			setData(json)
		} catch (e) {
			setError(e.message || 'Nie udało się załadować statystyk')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		load()
	}, [code, months])

	const partnerLink = useMemo(() => {
		if (typeof window === 'undefined') return ''
		const origin = window.location.origin
		return `${origin}/?ref=${code}`
	}, [code])

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(partnerLink)
			alert('Link skopiowany')
		} catch {
			alert('Nie udało się skopiować linku')
		}
	}

	if (loading) return <div className='max-w-5xl mx-auto p-4'>Ładowanie…</div>
	if (error)
		return (
			<div className='max-w-5xl mx-auto p-4 text-red-600'>Błąd: {error}</div>
		)
	if (!data?.ok)
		return <div className='max-w-5xl mx-auto p-4'>Partner nie znaleziony</div>

	const totals = data.totals || {}
	const daily = data.daily || []

	return (
		<div className='max-w-5xl mx-auto p-4 space-y-4 text-black'>
			{/* Header */}
			<header className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
				<h1 className='text-2xl font-bold text-white'>Partner: {code}</h1>

				<div className='w-full sm:w-auto flex flex-col gap-2 sm:flex-row sm:items-center'>
					<input
						readOnly
						value={partnerLink}
						onFocus={e => e.target.select()}
						className='w-full sm:w-[360px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm'
					/>
					<button
						onClick={copyLink}
						className='w-full sm:w-auto rounded-lg border border-gray-900 bg-gray-900 px-4 py-2 text-white hover:bg-black transition'
					>
						Skopiuj
					</button>
				</div>
			</header>

			{/* KPI */}
			<section className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6'>
				<KPI title='Unikalne wizyty' value={totals.uniqueVisitors ?? 0} />
				<KPI title='Szybkie połączenia' value={totals.calls ?? 0} />
				<KPI title='Zamówienia' value={totals.orders ?? 0} />
				<KPI
					title='Konwersja'
					value={`${((totals.cr || 0) * 100).toFixed(1)} %`}
				/>
				<KPI
					title='Suma prowizji'
					value={<ZL value={totals.commission || 0} />}
				/>
				{'commissionPct' in totals ? (
					<KPI
						title='Stawka partnera'
						value={`${totals.commissionPct ?? 10} %`}
					/>
				) : null}
			</section>

			{/* Wizyty dziennie — фикс высота + скролл, sticky thead */}
			<section className='bg-white border border-gray-200 rounded-xl overflow-hidden'>
				<div className='px-4 py-3 border-b border-gray-200 font-semibold'>
					Wizyty dziennie (ostatnie {DAYS_WINDOW} dni)
				</div>

				<div className='max-h-80 overflow-y-auto'>
					{' '}
					{/* <-- фикс высота */}
					<table className='w-full min-w-[360px] border-collapse text-sm'>
						<thead className='sticky top-0 bg-gray-50'>
							<tr className='text-left'>
								{['Data', 'Wizyty', 'Połączenia QR'].map(label => (
									<Th key={label}>{label}</Th>
								))}
							</tr>
						</thead>
						<tbody>
							{daily.length === 0 ? (
								<tr>
									<Td colSpan={3} className='text-center text-gray-500'>
										Brak danych
									</Td>
								</tr>
							) : (
								daily.map(row => (
									<tr key={row.date}>
										<Td>{row.date}</Td>
										<Td>{row.visitors}</Td>
										<Td>{row.calls}</Td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</section>

			{/* Miesięczna prowizja + wizyty */}
			<section className='bg-white border border-gray-200 rounded-xl overflow-hidden'>
				<div className='flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200'>
					<div className='font-semibold'>Prowizja miesięczna</div>
					<div className='flex items-center gap-2'>
						<label className='text-sm text-gray-600'>Zakres:</label>
						<select
							value={months}
							onChange={e => setMonths(Number(e.target.value))}
							className='rounded-md border border-gray-300 bg-white px-2 py-1 text-sm'
						>
							<option value={1}>1 mies.</option>
							<option value={3}>3 mies.</option>
							<option value={6}>6 mies.</option>
							<option value={12}>12 mies.</option>
						</select>
					</div>
				</div>

				<div className='overflow-x-auto'>
					<table className='w-full min-w-[480px] border-collapse text-sm'>
						<thead className='bg-gray-50'>
							<tr className='text-left'>
								{[
									'Miesiąc',
									'Wizyty',
									'Połączenia QR',
									'Zamówienia',
									'Suma prowizji',
								].map(label => (
									<Th key={label}>{label}</Th>
								))}
							</tr>
						</thead>
						<tbody>
							{!data.monthly || data.monthly.length === 0 ? (
								<tr>
									<Td colSpan={5} className='text-center text-gray-500'>
										Brak danych
									</Td>
								</tr>
							) : (
								data.monthly.map(row => (
									<tr key={row.month}>
										<Td>{row.month}</Td>
										<Td>{row.visits}</Td>
										<Td>{row.calls}</Td>
										<Td>{row.orders}</Td>
										<Td>
											<ZL value={row.commission} />
										</Td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</section>

			{/* Odśwież */}
			<div className='flex justify-end'>
				<button
					onClick={load}
					className='rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 hover:bg-gray-100 transition'
				>
					Odśwież dane
				</button>
			</div>
		</div>
	)
}

/* Subcomponents */

function KPI({ title, value }) {
	return (
		<div className='bg-white border border-gray-200 rounded-xl p-4 grid gap-1'>
			<div className='text-xs text-gray-500'>{title}</div>
			<div className='text-2xl font-bold'>{value}</div>
		</div>
	)
}

function Th({ children }) {
	return (
		<th className='px-3 py-2 border-b border-gray-200 font-semibold text-sm'>
			{children}
		</th>
	)
}
function Td({ children, className = '', ...rest }) {
	return (
		<td
			{...rest}
			className={`px-3 py-2 border-b border-gray-100 text-sm ${className}`}
		>
			{children}
		</td>
	)
}
