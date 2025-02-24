import React from 'react'

const Input = ({
	value,
	defaultValue,
	onChange,
	placeholder = '',
	disabled = false,
	prefix,
	suffix,
}) => {
	const handleChange = e => {
		if (onChange) {
			onChange(e.target.value)
		}
	}

	return (
		<div
			className={`flex items-center border md:border-2 border-white rounded-xl md:rounded-3xl px-3 py-4 md:px-6 md:py-4 font-semibold transition focus-within:border-white focus-within:ring-2 focus-within:ring-white ${
				disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
			}`}
		>
			{prefix && <span className='ml-2 text-gray-500'>{prefix}</span>}
			<input
				type='text'
				className='flex-1 outline-none bg-transparent w-full'
				value={value}
				defaultValue={defaultValue}
				onChange={handleChange}
				placeholder={placeholder}
				disabled={disabled}
			/>
			{suffix && <span className='mr-2 text-gray-500'>{suffix}</span>}
		</div>
	)
}

export default Input
