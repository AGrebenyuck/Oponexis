// 💡 Очищенная и безопасная версия каскадного Select с SelectOption

import {
	Children,
	cloneElement,
	forwardRef,
	useEffect,
	useLayoutEffect,
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
		const [optionMetaMap, setOptionMetaMap] = useState({})
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

		useEffect(() => {
			if (value !== undefined) {
				setSelected(value)
			}
		}, [value])

		// 💡 Безопасный сбор meta только один раз
		useLayoutEffect(() => {
			const map = {}

			Children.forEach(children, child => {
				if (!child?.props?.value) return

				const value = child.props.value
				const label = extractLabel(child.props.children)
				const subOptions = child.props.subOptions || []

				map[value] = { label, subOptions }

				subOptions.forEach(sub => {
					map[sub.value] = { label: sub.label, parent: value }
				})
			})

			setOptionMetaMap(map)
		}, [children])

		const handleSelect = (selectedValue, isSub = false) => {
			if (multiple) {
				let newValues = []

				if (selected.includes(selectedValue)) {
					newValues = selected.filter(v => v !== selectedValue)

					if (!isSub && optionMetaMap[selectedValue]?.subOptions?.length > 0) {
						const subValues = optionMetaMap[selectedValue].subOptions.map(
							s => s.value
						)
						newValues = newValues.filter(v => !subValues.includes(v))
					}
				} else {
					newValues = [...selected, selectedValue]
				}

				setSelected(newValues)
				onChange?.(newValues)
			} else {
				const newValue = selected === selectedValue ? null : selectedValue
				setSelected(newValue)
				onChange?.(newValue)
				setOpen(false)
			}
		}

		const handleRemove = valueToRemove => {
			const subValues =
				optionMetaMap[valueToRemove]?.subOptions?.map(s => s.value) || []
			const newValues = selected.filter(
				v => v !== valueToRemove && !subValues.includes(v)
			)
			setSelected(newValues)
			onChange?.(newValues)
		}

		const renderGroupedTags = () => {
			const groups = {}

			selected.forEach(val => {
				const meta = optionMetaMap[val]
				if (!meta) return

				const parent = meta.parent || val

				if (!groups[parent]) {
					groups[parent] = {
						label: optionMetaMap[parent]?.label,
						subs: [],
						hasParent: !!meta.parent,
					}
				}

				if (meta.parent) {
					groups[parent].subs.push({ label: meta.label, value: val })
				}
			})

			return Object.entries(groups).flatMap(([key, group]) => {
				const tags = []

				tags.push(
					<span
						key={key}
						className='bg-blue-100 text-blue-800 px-2 py-1 text-sm rounded flex items-center mr-1 mb-1'
					>
						{group.label}
						<span
							className='ml-1 text-red-500 cursor-pointer'
							onClick={e => {
								e.stopPropagation()
								handleRemove(key)
							}}
						>
							✕
						</span>
					</span>
				)

				group.subs.forEach(sub => {
					tags.push(
						<span
							key={sub.value}
							className='bg-gray-200 text-gray-800 px-2 py-1 text-xs rounded flex items-center mr-1 mb-1 ml-2'
						>
							{sub.label}
							<span
								className='ml-1 text-red-500 cursor-pointer'
								onClick={e => {
									e.stopPropagation()
									handleRemove(sub.value)
								}}
							>
								✕
							</span>
						</span>
					)
				})

				return tags
			})
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
						<div className='flex flex-wrap gap-1 text-left'>
							{selected.length > 0 ? (
								renderGroupedTags()
							) : (
								<span className='text-gray-400'>{placeholder}</span>
							)}
						</div>
					) : (
						<span className={selected ? '' : 'text-gray-400'}>
							{optionMetaMap[selected]?.label || placeholder}
						</span>
					)}
					<span className='ml-2'>
						{open ? <SelectArrowUp /> : <SelectArrowDown />}
					</span>
				</button>

				{open && (
					<div className='absolute bottom-full w-full mb-1 bg-primary-blue border lg:border-2 border-white rounded-xl lg:rounded-3xl shadow-lg p-3 flex flex-col items-start md:items-center gap-1 z-10 max-h-[300px] overflow-y-scroll'>
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

function extractLabel(labelNode) {
	if (typeof labelNode === 'string') return labelNode
	if (Array.isArray(labelNode))
		return labelNode.find(c => typeof c === 'string') || ''
	if (labelNode?.props?.children) {
		const children = labelNode.props.children
		if (typeof children === 'string') return children
		if (Array.isArray(children))
			return children.find(c => typeof c === 'string') || ''
	}
	return ''
}

export const SelectOption = ({
	children,
	value,
	onSelect,
	selected,
	multiple,
	subOptions = [],
}) => {
	const isSelected = Array.isArray(selected)
		? selected.includes(value)
		: selected === value

	const handleClick = () => {
		onSelect(value, false)
	}

	const handleSubSelect = subVal => {
		onSelect(subVal, true)
	}

	return (
		<div className='w-full'>
			<button
				className={`py-2 px-6 w-full text-left cursor-pointer transition-all hover:bg-white hover:text-primary-blue rounded-3xl flex items-center gap-2 ${
					isSelected ? 'bg-white text-primary-blue' : ''
				}`}
				onClick={handleClick}
				type='button'
			>
				{multiple && (
					<input
						type='checkbox'
						checked={isSelected}
						readOnly
						className='mr-2'
					/>
				)}
				{children}
			</button>

			{isSelected && subOptions.length > 0 && (
				<div className='ml-6 mt-1 flex flex-col gap-1'>
					{subOptions.map(sub => {
						const isSubSelected = selected.includes(sub.value)
						return (
							<button
								key={sub.value}
								className={`py-1 px-4 text-left rounded-2xl transition-all hover:bg-white hover:text-primary-blue ${
									isSubSelected ? 'bg-white text-primary-blue' : ''
								}`}
								onClick={e => {
									e.preventDefault()
									e.stopPropagation()
									handleSubSelect(sub.value)
								}}
							>
								{multiple && (
									<input
										type='checkbox'
										checked={isSubSelected}
										readOnly
										className='mr-2'
									/>
								)}
								{sub.label} - {sub.price} PLN
							</button>
						)
					})}
				</div>
			)}
		</div>
	)
}

export default Select
