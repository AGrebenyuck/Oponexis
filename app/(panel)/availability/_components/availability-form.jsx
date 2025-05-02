'use client'

import { updateAvailability } from '@/actions/availability'
import EditableTable from '@/components/EditableTable/EditableTable'
import message from '@/components/ui/message'
import Spin from '@/components/ui/spin'
import useFetch from '@/hooks/useFetch'
import { useEffect, useMemo, useState } from 'react'
import { defaultAvailability, timeSlots } from '../data'

const AvailabilityTable = ({ initialData = defaultAvailability }) => {
	const [availability, setAvailability] = useState([])
	const [originalAvailability, setOriginalAvailability] = useState([])
	const [isDirty, setIsDirty] = useState(false)
	const [loadAvailability, setLoadAvailability] = useState(true)
	const [timeGap, setTimeGap] = useState(0)

	const {
		fn: fnUpdateAvailability,
		loading,
		data,
		error,
	} = useFetch(updateAvailability)

	useEffect(() => {
		setLoadAvailability(true)

		const loadData = async () => {
			const days = Object.entries(initialData)
				.filter(([day]) => day !== 'timeGap')
				.map(([day, info]) => ({
					day,
					isAvailable: info.isAvailable,
					startTime: info.startTime,
					endTime: info.endTime,
				}))

			setAvailability(days)
			setOriginalAvailability(days)
			setTimeGap(initialData.timeGap || 0)
			setLoadAvailability(false)
		}

		loadData()
	}, [initialData])

	useEffect(() => {
		if (data === undefined) return
		if (data?.success) {
			message.success('✅ Zaktualizowano dostępność!')
		} else {
			message.error('❌ Błąd aktualizacji: ' + error)
		}
	}, [data])

	const columns = useMemo(() => {
		if (loadAvailability) return null

		return [
			{
				title: 'Dzień',
				dataIndex: 'day',
				render: value => (
					<span className='capitalize text-primary-blue md:text-white'>
						{translateDay(value)}
					</span>
				),
				editable: false,
			},
			{
				title: 'Dostępny',
				dataIndex: 'isAvailable',
				render: (value, row, rowIndex) => (
					<input
						type='checkbox'
						checked={value}
						onChange={e => {
							const updated = [...availability]
							updated[rowIndex].isAvailable = e.target.checked
							if (!e.target.checked) {
								updated[rowIndex].startTime = '09:00'
								updated[rowIndex].endTime = '17:00'
							}
							setAvailability(updated)
							setIsDirty(true)
						}}
					/>
				),
			},
			{
				title: 'Od',
				dataIndex: 'startTime',
				render: (value, row, rowIndex) =>
					row.isAvailable && (
						<select
							className='bg-transparent text-primary-blue md:text-white border rounded p-1 w-full'
							value={value}
							onChange={e => {
								const updated = [...availability]
								updated[rowIndex].startTime = e.target.value
								setAvailability(updated)
								setIsDirty(true)
							}}
						>
							{timeSlots.map(time => (
								<option key={time} value={time}>
									{time}
								</option>
							))}
						</select>
					),
			},
			{
				title: 'Do',
				dataIndex: 'endTime',
				render: (value, row, rowIndex) =>
					row.isAvailable && (
						<select
							className='bg-transparent text-primary-blue md:text-white border rounded p-1 w-full'
							value={value}
							onChange={e => {
								const updated = [...availability]
								updated[rowIndex].endTime = e.target.value
								setAvailability(updated)
								setIsDirty(true)
							}}
						>
							{timeSlots.map(time => (
								<option key={time} value={time}>
									{time}
								</option>
							))}
						</select>
					),
			},
		]
	}, [loadAvailability, availability])

	const handleSave = async () => {
		const result = {}

		availability.forEach(day => {
			result[day.day] = {
				isAvailable: day.isAvailable,
				startTime: day.startTime,
				endTime: day.endTime,
			}
		})

		result.timeGap = timeGap

		await fnUpdateAvailability(result)
		setOriginalAvailability(availability)
		setIsDirty(false)
	}

	return (
		<div className='space-y-6'>
			{!columns ? (
				<div className='flex justify-center items-center min-h-[200px]'>
					<Spin size='large' />
				</div>
			) : (
				<>
					<EditableTable
						title='Dostępność'
						data={availability}
						onChange={data => {
							setAvailability(data)
							setIsDirty(true)
						}}
						isDirty={isDirty}
						showActions={false}
						showAddButton={false}
						columns={columns}
					/>

					<div className='border rounded-xl p-4 space-y-3'>
						<h3 className='text-base font-bold'>
							Przerwa między terminami (w minutach)
						</h3>
						<input
							type='number'
							className='border p-2 text-primary-blue rounded w-full'
							value={timeGap}
							onChange={e => {
								setTimeGap(Number(e.target.value) || 0)
								setIsDirty(true)
							}}
						/>
					</div>

					<div className='text-right pt-4'>
						<button
							onClick={handleSave}
							className='bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50'
							disabled={!isDirty || loading}
						>
							{loading ? 'Zapisywanie...' : 'Zapisz zmiany'}
						</button>
					</div>
				</>
			)}
		</div>
	)
}

export default AvailabilityTable

function translateDay(day) {
	const days = {
		monday: 'Poniedziałek',
		tuesday: 'Wtorek',
		wednesday: 'Środa',
		thursday: 'Czwartek',
		friday: 'Piątek',
		saturday: 'Sobota',
		sunday: 'Niedziela',
	}
	return days[day] || day
}
