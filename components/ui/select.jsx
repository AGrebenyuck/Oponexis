import {
	Children,
	cloneElement,
	forwardRef,
	useEffect,
	useRef,
	useState,
} from 'react'
import { SelectArrowDown, SelectArrowUp } from '../Icons'

const Select = forwardRef(
	(
		{
			children,
			placeholder = 'Wybierz...',
			onChange,
			value,
			defaultValue = null,
			multiple = false,
		},
		ref
	) => {
		const [selected, setSelected] = useState(
			value ?? defaultValue ?? (multiple ? [] : '')
		)
		const [open, setOpen] = useState(false)
		const selectRef = useRef(null)

		// Закрытие при клике вне компонента
		useEffect(() => {
			const handleClickOutside = event => {
				if (selectRef.current && !selectRef.current.contains(event.target)) {
					setOpen(false)
				}
			}
			document.addEventListener('mousedown', handleClickOutside)
			return () => document.removeEventListener('mousedown', handleClickOutside)
		}, [])

		useEffect(() => {
			if (value !== undefined) {
				setSelected(value)
			}
		}, [value])

		// Обработка выбора элемента
		const handleSelect = selectedValue => {
			if (multiple) {
				const newValues = selected.includes(selectedValue)
					? selected.filter(v => v !== selectedValue)
					: [...selected, selectedValue]

				setSelected(newValues)
				onChange && onChange(newValues)
			} else {
				const newValue = selected === selectedValue ? null : selectedValue
				setSelected(newValue)
				onChange && onChange(newValue)
				setOpen(false)
			}
		}

		// Удаление элемента из выбора (для multiple)
		const handleRemove = selectedValue => {
			const newValues = selected.filter(v => v !== selectedValue)
			setSelected(newValues)
			onChange && onChange(newValues)
		}

		return (
			<div ref={selectRef} className='relative inline-block w-full'>
				<button
					ref={ref}
					className='border md:border-2 border-white rounded-xl md:rounded-3xl px-3 py-4 md:px-6 md:py-4 font-semibold cursor-pointer flex justify-between items-center w-full'
					onClick={() => setOpen(!open)}
					type='button'
				>
					{multiple ? (
						<div className='flex flex-wrap gap-1'>
							{Array.isArray(selected) && selected.length > 0 ? (
								selected.map(val => (
									<span
										key={val}
										className='bg-blue-100 text-blue-800 px-2 py-1 text-sm rounded flex items-center'
									>
										{val}
										<span
											type='button'
											className='ml-1 text-red-500'
											onClick={e => {
												e.stopPropagation()
												handleRemove(val)
											}}
										>
											✕
										</span>
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
					<div className='absolute w-full mt-1 bg-primary-blue border lg:border-2 border-white rounded-xl lg:rounded-3xl shadow-lg p-3 flex flex-col items-start md:items-center gap-1 z-10 max-h-[300px] overflow-y-scroll'>
						{Children.map(children, child =>
							cloneElement(child, {
								onSelect: handleSelect,
								selected,
								multiple,
							})
						)}
					</div>
				)}
			</div>
		)
	}
)

const SelectOption = ({ children, value, onSelect, selected, multiple }) => {
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

export { Select, SelectOption }
