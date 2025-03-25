import { forwardRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { ErrorIcon } from '../Icons'
import Popover from './popover'

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
			autoComplete,
			...rest
		},
		ref
	) => {
		const form = useFormContext()
		const isFormContextAvailable = !!form // ✅ Проверяем, есть ли контекст

		// ✅ Если форма доступна, используем её методы
		const { register, watch, formState, setValue } = isFormContextAvailable
			? form
			: {
					register: () => {},
					watch: () => {},
					formState: { errors: {} },
					setValue: () => {},
			  }

		const errors = formState.errors
		const value = watch(name) || ''

		const handleChange = e => {
			if (!e || !e.target) return
			let newValue = e.target.value || ''
			if (isFormContextAvailable) {
				setValue(name, newValue) // ✅ Если есть форма, обновляем значение в react-hook-form
			}
			onChange?.(e) // ✅ Вызываем `onChange`, если он передан
		}

		const hasError = errors?.[name] || null

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
					{prefix && <span className='ml-2 text-gray-500'>{prefix}</span>}

					<input
						{...(isFormContextAvailable ? register(name) : {})} // ✅ Регистрируем только если есть форма
						ref={ref}
						type={type}
						className='flex-1 outline-none bg-transparent w-full'
						placeholder={value ? '' : placeholder}
						disabled={disabled}
						value={value}
						onChange={handleChange}
						autoComplete={autoComplete}
						{...rest}
					/>

					{hasError ? (
						<Popover content={hasError.message}>
							<button
								type='button'
								onMouseDown={e => {
									e.preventDefault() // 💡 Блокируем фокусировку
									e.stopPropagation() // 💡 На всякий случай
								}}
							>
								<ErrorIcon className='w-5 h-5' />
							</button>
						</Popover>
					) : (
						suffix && <span className='ml-2 text-gray-500'>{suffix}</span>
					)}
				</div>
			</div>
		)
	}
)

export default Input
