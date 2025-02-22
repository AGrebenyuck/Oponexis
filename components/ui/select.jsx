import { Children, cloneElement, useEffect, useRef, useState } from 'react'
import { SelectArrowDown, SelectArrowUp } from '../Icons'

const Select = ({
	children,
	placeholder = 'Wybierz...',
	onChange,
	multiple = false,
}) => {
	const [selected, setSelected] = useState(multiple ? [] : null)
	const [open, setOpen] = useState(false)
	const selectRef = useRef(null)

	useEffect(() => {
		const handleClickOutside = event => {
			if (selectRef.current && !selectRef.current.contains(event.target)) {
				setOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	const handleSelect = value => {
		if (multiple) {
			setSelected(prev => {
				const newValues = prev.includes(value)
					? prev.filter(v => v !== value)
					: [...prev, value]
				onChange && onChange(newValues)
				return newValues
			})
		} else {
			setSelected(prev => (prev === value ? null : value))
			onChange && onChange(selected === value ? null : value)
			setOpen(false)
		}
	}

	const handleRemove = value => {
		setSelected(prev => {
			const newValues = prev.filter(v => v !== value)
			onChange && onChange(newValues)
			return newValues
		})
	}

	return (
		<div ref={selectRef} className='relative inline-block w-full'>
			<button
				className='border-[0.4px] md:border-2 border-white rounded-xl md:rounded-3xl px-3 py-4 md:px-6 md:py-4 font-semibold cursor-pointer flex justify-between items-center w-full'
				onClick={() => setOpen(!open)}
				type='button'
			>
				{multiple ? (
					<div className='flex flex-wrap gap-1'>
						{selected.length > 0 ? (
							selected.map(val => (
								<span
									key={val}
									className='bg-blue-100 text-blue-800 px-2 py-1 text-sm rounded flex items-center'
								>
									{val}
									<button
										type='button'
										className='ml-1 text-red-500'
										onClick={e => {
											e.stopPropagation()
											handleRemove(val)
										}}
									>
										✕
									</button>
								</span>
							))
						) : (
							<span className='text-gray-400'>{placeholder}</span>
						)}
					</div>
				) : (
					<span className={selected ? '' : 'text-gray-400'}>
						{selected || placeholder}
					</span>
				)}
				<span className='ml-2'>
					{open ? <SelectArrowUp /> : <SelectArrowDown />}
				</span>
			</button>

			{open && (
				<div className='absolute w-full mt-1 bg-primary-blue border-[0.4px] lg:border-2 border-white rounded-xl lg:rounded-3xl shadow-lg p-3 flex flex-col items-center gap-1'>
					{Children.map(children, child =>
						cloneElement(child, { onSelect: handleSelect, selected, multiple })
					)}
				</div>
			)}
		</div>
	)
}

const Option = ({ children, value, onSelect, selected, multiple }) => {
	const isSelected = Array.isArray(selected)
		? selected.includes(value)
		: selected === value

	return (
		<button
			className={`py-2 pl-16 pr-16 w-fit cursor-pointer transition-all hover:bg-white hover:text-primary-blue rounded-3xl flex items-center gap-1 ${
				isSelected ? 'bg-white text-primary-blue' : ''
			}`}
			onClick={() => onSelect(value)}
			type='button'
		>
			{multiple && (
				<input type='checkbox' checked={isSelected} readOnly className='mr-2' />
			)}
			{children}
		</button>
	)
}

export { Option, Select }
