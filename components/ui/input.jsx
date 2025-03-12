import { forwardRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import Tooltip from './tooltip'

const Input = forwardRef(
	(
		{
			name,
			placeholder = '',
			disabled = false,
			prefix,
			suffix,
			type = 'text',
			className = '',
			onChange,
			value: propValue,
			...rest
		},
		ref
	) => {
		const [inputValue, setInputValue] = useState(propValue || '')
		const form = useFormContext()
		const errors = form?.formState.errors

		const handleChange = e => {
			let value = e.target.value
			setInputValue(value)
			onChange && onChange({ target: { name, value } })
		}

		const hasError = errors?.[name] || null // Проверяем ошибку

		return (
			<div className='relative w-full'>
				<div
					className={`flex items-center border md:border-2 rounded-xl md:rounded-3xl px-3 py-4 md:px-6 md:py-4 font-semibold transition focus-within:ring-2 ${
						hasError
							? 'border-red-500 ring-red-500'
							: 'border-white focus-within:border-white focus-within:ring-white'
					} ${
						disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
					} ${className}`}
				>
					{/* Префикс с иконкой ошибки */}
					{prefix && <span className='ml-2 text-gray-500'>{prefix}</span>}

					<input
						ref={ref}
						name={name}
						type={type}
						className='flex-1 outline-none bg-transparent w-full'
						placeholder={inputValue ? '' : placeholder}
						disabled={disabled}
						value={inputValue}
						onChange={handleChange}
						{...rest}
					/>

					{hasError ? (
						<Tooltip text={hasError.message} position='top'>
							<span className='ml-2 text-red-500 p-2'>X</span>
						</Tooltip>
					) : (
						suffix && <span className='ml-2 text-gray-500'>{suffix}</span>
					)}
				</div>
			</div>
		)
	}
)

export default Input
