'use client'

import { getPromoCodes, updatePromoCodes } from '@/actions/promocode'
import EditableTable from '@/components/EditableTable/EditableTable'
import message from '@/components/ui/message'
import Spin from '@/components/ui/spin'
import { useEffect, useState } from 'react'

export default function PromoCodeTable() {
	const [promoCodes, setPromoCodes] = useState([])
	const [originalPromoCodes, setOriginalPromoCodes] = useState([])
	const [isDirty, setIsDirty] = useState(false)

	useEffect(() => {
		const fetchData = async () => {
			const res = await getPromoCodes()
			setPromoCodes(res.promocodes)
			setOriginalPromoCodes(res.promocodes)
		}
		fetchData()
	}, [])

	const handleSave = async () => {
		const { created, updated, deleted } = diffData(
			originalPromoCodes,
			promoCodes
		)

		await updatePromoCodes({ created, updated, deleted })
		setOriginalPromoCodes(promoCodes)
		setIsDirty(false)
		message.success('✅ Promokody zostały pomyślnie zapisane!')
	}

	return (
		<>
			{promoCodes.length === 0 ? (
				<div className='flex justify-center items-center min-h-[200px]'>
					<Spin size='large' />
				</div>
			) : (
				<EditableTable
					title='Promokody'
					data={promoCodes}
					onChange={data => {
						setPromoCodes(data)
						setIsDirty(true)
					}}
					onSave={handleSave}
					isDirty={isDirty}
					columns={[
						{ title: 'Kod', dataIndex: 'code' },
						{
							title: 'Typ zniżki',
							dataIndex: 'type',
							render: (value, row, rowIndex) => (
								<select
									className='bg-transparent text-primary-blue md:text-white border rounded p-1 w-full'
									value={value}
									onChange={e => {
										const newData = [...promoCodes]
										newData[rowIndex].type = e.target.value
										setPromoCodes(newData)
										setIsDirty(true)
									}}
								>
									<option value='percentage'>Procentowa</option>
									<option value='fixed'>Stała kwota</option>
								</select>
							),
						},
						{ title: 'Wartość zniżki', dataIndex: 'value', type: 'number' },
						{ title: 'Użycia', dataIndex: 'uses', editable: false },
					]}
					getNewItem={() => ({
						id: `p-${Date.now()}`,
						code: '',
						type: 'percentage',
						value: 0,
						uses: 0,
					})}
				/>
			)}
		</>
	)
}

function diffData(original, current) {
	const originalMap = new Map(original.map(item => [item.id, item]))
	const currentMap = new Map(current.map(item => [item.id, item]))

	const created = []
	const updated = []
	const deleted = []

	for (const [id, item] of currentMap.entries()) {
		if (!originalMap.has(id)) {
			created.push(item)
		} else if (JSON.stringify(originalMap.get(id)) !== JSON.stringify(item)) {
			updated.push(item)
		}
	}

	for (const [id, item] of originalMap.entries()) {
		if (!currentMap.has(id)) {
			deleted.push(item)
		}
	}

	return { created, updated, deleted }
}
