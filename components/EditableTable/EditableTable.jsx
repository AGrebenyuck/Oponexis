import { AnimatePresence, motion } from 'framer-motion'
import React from 'react'
import EditableCell from './EditableCell'

export default function EditableTable({
	title,
	data = [],
	onChange,
	onSave,
	columns = [],
	getNewItem,
	getNewSubItem,
	isDirty = false,
	renderSubRows,
	showActions = true,
	showAddButton = true,
}) {
	const handleChange = (rowIndex, field, value) => {
		const updated = [...data]
		updated[rowIndex] = {
			...updated[rowIndex],
			[field]: value,
		}
		onChange?.(updated)
	}

	const handleSubChange = (rowIndex, subIndex, updatedSub) => {
		const updated = [...data]
		updated[rowIndex] = {
			...updated[rowIndex],
			additionalServices: updated[rowIndex].additionalServices.map((sub, i) =>
				i === subIndex ? updatedSub : sub
			),
		}
		onChange?.(updated)
	}

	const handleDelete = rowIndex => {
		const updated = data.filter((_, i) => i !== rowIndex)
		onChange?.(updated)
	}

	const handleSubDelete = (rowIndex, subIndex) => {
		const updated = [...data]
		updated[rowIndex] = {
			...updated[rowIndex],
			additionalServices: updated[rowIndex].additionalServices.filter(
				(_, i) => i !== subIndex
			),
		}
		onChange?.(updated)
	}

	const handleAdd = () => {
		onChange?.([...data, getNewItem()])
	}

	const handleAddSub = rowIndex => {
		const updated = [...data]
		updated[rowIndex] = {
			...updated[rowIndex],
			additionalServices: [
				...(updated[rowIndex].additionalServices || []),
				getNewSubItem(),
			],
		}
		onChange?.(updated)
	}

	return (
		<div className='w-full border rounded-xl p-4 space-y-4'>
			<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2'>
				<h2 className='text-base sm:text-lg font-bold'>{title}</h2>
				{showAddButton && getNewItem && (
					<button
						onClick={handleAdd}
						className='text-sm sm:text-base bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
					>
						Dodaj
					</button>
				)}
			</div>

			{/* Widok tabeli (desktop) */}
			<div className='hidden sm:block overflow-x-auto'>
				<table className='min-w-[600px] w-full text-sm border-collapse'>
					<thead>
						<tr className='bg-gray-100 text-secondary-orange'>
							{columns.map(col => (
								<th
									key={col.dataIndex}
									className='p-2 text-left font-semibold border-b'
								>
									{col.title}
								</th>
							))}
							{showActions && (
								<th className='p-2 font-semibold border-b text-right'>
									Działanie
								</th>
							)}
						</tr>
					</thead>
					<tbody>
						<AnimatePresence>
							{data.map((row, rowIndex) => {
								const isFirst = rowIndex === 0

								return (
									<React.Fragment key={`fragment-${row.id || rowIndex}`}>
										<motion.tr
											key={`table-${row.id || rowIndex}`}
											initial={{ opacity: 0, y: 8 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -8 }}
											transition={{ duration: 0.2 }}
											className={`${
												isFirst ? '' : 'border-t-2 border-t-gray-200'
											}`}
										>
											{columns.map(col => {
												const value = row[col.dataIndex]
												const editable = col.editable ?? true

												return (
													<td
														key={`table-${col.dataIndex}`}
														className='p-2 align-top'
													>
														{col.render ? (
															col.render(value, row, rowIndex)
														) : editable ? (
															<EditableCell
																value={value}
																onChange={val =>
																	handleChange(rowIndex, col.dataIndex, val)
																}
																type={col.type}
															/>
														) : (
															<span className='text-primary-blue md:text-gray-600'>
																{value}
															</span>
														)}
													</td>
												)
											})}
											{showActions && (
												<td className='p-2 text-right whitespace-nowrap space-x-2'>
													{getNewSubItem && (
														<button
															onClick={() => handleAddSub(rowIndex)}
															className='text-xs text-blue-600 hover:underline'
														>
															+ Podusługa
														</button>
													)}
													<button
														onClick={() => handleDelete(rowIndex)}
														className='text-xs text-red-600 hover:underline'
													>
														Usuń
													</button>
												</td>
											)}
										</motion.tr>
										{renderSubRows?.(
											row,
											rowIndex,
											handleSubChange,
											handleSubDelete
										)}
									</React.Fragment>
								)
							})}
						</AnimatePresence>
					</tbody>
				</table>
			</div>

			{/* Widok kart (mobile) */}
			<div className='sm:hidden space-y-4'>
				{data.map((row, rowIndex) => (
					<div
						key={`card-${row.id || rowIndex}`}
						className='bg-white rounded-xl border shadow-sm p-4 space-y-2'
					>
						{columns.map(col => {
							const value = row[col.dataIndex]
							const editable = col.editable ?? true

							return (
								<div
									key={`card-${col.dataIndex}`}
									className='flex justify-between gap-2'
								>
									<span className='text-gray-500 text-sm'>{col.title}</span>
									<div className='text-right w-1/2'>
										{col.render ? (
											col.render(value, row, rowIndex)
										) : editable ? (
											<EditableCell
												value={value}
												onChange={val =>
													handleChange(rowIndex, col.dataIndex, val)
												}
												type={col.type}
											/>
										) : (
											<span className='text-primary-blue md:text-white'>
												{value}
											</span>
										)}
									</div>
								</div>
							)
						})}
						{showActions && (
							<div className='flex justify-end gap-3 pt-2 text-sm'>
								{getNewSubItem && (
									<button
										onClick={() => handleAddSub(rowIndex)}
										className='text-blue-600 hover:underline'
									>
										+ Podusługa
									</button>
								)}
								<button
									onClick={() => handleDelete(rowIndex)}
									className='text-red-600 hover:underline'
								>
									Usuń
								</button>
							</div>
						)}
						{renderSubRows?.(
							row,
							rowIndex,
							handleSubChange,
							handleSubDelete,
							true
						)}
					</div>
				))}
			</div>

			{onSave && (
				<div className='text-right pt-4'>
					<button
						onClick={() => onSave(data)}
						disabled={!isDirty}
						className={`px-6 py-2 rounded ${
							isDirty
								? 'bg-green-600 hover:bg-green-700 text-white'
								: 'bg-gray-300 text-gray-500 cursor-not-allowed'
						}`}
					>
						Zapisz
					</button>
				</div>
			)}
		</div>
	)
}
