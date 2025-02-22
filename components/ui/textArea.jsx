import React, { useState, useEffect } from 'react'

const TextArea = ({
	value,
	defaultValue,
	onChange,
	placeholder = '',
	disabled = false,
	autoSize = false,
}) => {
	const [text, setText] = useState(defaultValue || '')

	useEffect(() => {
		if (value !== undefined) {
			setText(value)
		}
	}, [value])

	const handleChange = e => {
		const newValue = e.target.value
		setText(newValue)
		if (onChange) {
			onChange(newValue)
		}
	}

	return (
		<textarea
			className={`w-full bg-transparent border-[0.4px] md:border-2 border-white rounded-xl md:rounded-3xl px-3 py-4 md:px-6 md:py-4 font-semibold transition focus:border-white focus:ring-2 focus:ring-white ${
				disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
			}`}
			value={text}
			onChange={handleChange}
			placeholder={placeholder}
			disabled={disabled}
			style={autoSize ? { height: `${text.split('\n').length * 20}px` } : {}}
		/>
	)
}

export default TextArea
