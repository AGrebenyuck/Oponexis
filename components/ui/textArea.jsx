import { forwardRef, useEffect, useState } from 'react'

const TextArea = forwardRef(
	(
		{
			value,
			defaultValue,
			onChange,
			placeholder = '',
			disabled = false,
			autoSize = false,
			resize = 'none',
			className = '',
			maxLength,
			rows = 3,
			...rest // Позволяет передавать `register` из `react-hook-form`
		},
		ref
	) => {
		const [text, setText] = useState(defaultValue || '')

		useEffect(() => {
			if (value !== undefined) {
				setText(value)
			}
		}, [value])

		const handleChange = e => {
			const newValue = e.target.value
			if (maxLength && newValue.length > maxLength) return // Ограничение по длине
			setText(newValue)
			if (onChange) {
				onChange(e)
			}
		}

		return (
			<div className={`relative ${className}`}>
				<textarea
					ref={ref}
					className={`w-full bg-transparent border border-white rounded-xl md:rounded-3xl px-3 py-4 md:px-6 md:py-4 font-semibold transition focus:border-white focus:ring-2 focus:ring-white ${
						disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
					}`}
					value={text}
					onChange={handleChange}
					placeholder={placeholder}
					disabled={disabled}
					rows={rows}
					style={{
						resize,
						height: autoSize
							? `${Math.max(50, text.split('\n').length * 20)}px`
							: 'auto',
					}}
					{...rest}
				/>
				{maxLength && (
					<span className='absolute bottom-2 right-4 text-gray-400 text-sm'>
						{text.length}/{maxLength}
					</span>
				)}
			</div>
		)
	}
)

export default TextArea
