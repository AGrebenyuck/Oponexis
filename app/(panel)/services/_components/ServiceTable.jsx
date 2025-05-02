'use client'

import { getServices, updateServices } from '@/actions/service'
import EditableCell from '@/components/EditableTable/EditableCell'
import EditableTable from '@/components/EditableTable/EditableTable'
import message from '@/components/ui/message'
import Spin from '@/components/ui/spin'
import { useEffect, useRef, useState } from 'react'

export default function ServiceTable() {
	const [services, setServices] = useState([])
	const [isDirty, setIsDirty] = useState(false)
	const originalDataRef = useRef([])

	useEffect(() => {
		const fetchData = async () => {
			const res = await getServices()
			setServices(res.prices)
			originalDataRef.current = res.prices
		}
		fetchData()
	}, [])

	useEffect(() => {
		if (JSON.stringify(services) !== JSON.stringify(originalDataRef.current)) {
			setIsDirty(true)
		} else {
			setIsDirty(false)
		}
	}, [services])

	const handleSave = async () => {
		try {
			const { created, updated, deleted } = diffServices(
				originalDataRef.current,
				services
			)

			await updateServices({ created, updated, deleted })

			message.success('✅ Usługi zostały pomyślnie zapisane!')
			originalDataRef.current = services
			setIsDirty(false)
		} catch (error) {
			console.error('❌ Błąd podczas zapisywania:', error)
			message.error('❌ Wystąpił błąd podczas zapisu')
		}
	}

	return (
		<>
			{services.length === 0 ? (
				<div className='flex justify-center items-center min-h-[200px]'>
					<Spin size='large' />
				</div>
			) : (
				<EditableTable
					title='Usługi'
					data={services}
					onChange={setServices}
					onSave={handleSave}
					isDirty={isDirty}
					getNewItem={() => ({
						id: `s-${Date.now()}`,
						name: '',
						price: 0,
						originalPrice: null,
						duration: 0,
						additionalServices: [],
					})}
					getNewSubItem={() => ({
						id: `sub-${Date.now()}`,
						name: '',
						price: 0,
					})}
					columns={[
						{ title: 'Nazwa', dataIndex: 'name' },
						{ title: 'Cena', dataIndex: 'price', type: 'number' },
						{
							title: 'Cena oryginalna',
							dataIndex: 'originalPrice',
							type: 'number',
						},
						{
							title: 'Czas trwania (min)',
							dataIndex: 'duration',
							type: 'number',
						},
					]}
					renderSubRows={(row, rowIndex, onSubChange, onSubDelete, isCard) =>
						row.additionalServices?.map((sub, subIndex) =>
							isCard ? (
								<div
									key={`card-sub-${sub.id}`}
									className='bg-gray-100 text-accent-blue p-3 rounded-lg mt-2 border text-sm'
								>
									<div className='flex justify-between mb-2'>
										<span className='text-gray-500'>↳ Podusługa</span>
										<button
											className='text-xs text-red-600 hover:underline'
											onClick={() => onSubDelete(rowIndex, subIndex)}
										>
											Usuń
										</button>
									</div>
									<div className='flex justify-between gap-2 items-center mb-1'>
										<span className='text-gray-500'>Nazwa</span>
										<EditableCell
											value={sub.name}
											onChange={val =>
												onSubChange(rowIndex, subIndex, { ...sub, name: val })
											}
										/>
									</div>
									<div className='flex justify-between gap-2 items-center'>
										<span className='text-gray-500'>Cena</span>
										<EditableCell
											value={sub.price}
											type='number'
											onChange={val =>
												onSubChange(rowIndex, subIndex, {
													...sub,
													price: parseFloat(val),
												})
											}
										/>
									</div>
								</div>
							) : (
								<tr key={`table-sub-${sub.id}`} className=''>
									<td className='p-2 pl-6'>
										<div className='flex items-center gap-1'>
											<span className='text-gray-400'>↳</span>
											<EditableCell
												value={sub.name}
												onChange={val =>
													onSubChange(rowIndex, subIndex, { ...sub, name: val })
												}
											/>
										</div>
									</td>
									<td className='p-2'>
										<EditableCell
											value={sub.price}
											type='number'
											onChange={val =>
												onSubChange(rowIndex, subIndex, {
													...sub,
													price: parseFloat(val),
												})
											}
										/>
									</td>
									<td className='p-2 text-left'>
										<button
											className='text-xs text-red-600 hover:underline'
											onClick={() => onSubDelete(rowIndex, subIndex)}
										>
											Usuń
										</button>
									</td>
								</tr>
							)
						)
					}
				/>
			)}
		</>
	)
}

function diffServices(oldData, newData) {
	const created = []
	const updated = []
	const deleted = []

	const oldIds = oldData.map(item => item.id)
	const newIds = newData.map(item => item.id)

	for (const oldItem of oldData) {
		if (!newIds.includes(oldItem.id)) {
			deleted.push(oldItem)
		}
	}

	for (const newItem of newData) {
		if (!oldIds.includes(newItem.id)) {
			created.push(newItem)
		} else {
			const oldItem = oldData.find(item => item.id === newItem.id)
			if (JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
				updated.push(newItem)
			}
		}
	}

	return { created, updated, deleted }
}
