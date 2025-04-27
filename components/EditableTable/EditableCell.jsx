export default function EditableCell({
	value,
	onChange,
	type = 'text',
	options = [],
}) {
	const safeValue = value ?? ''
	if (type === 'select') {
		return (
			<select
				className='bg-transparent text-primary-blue md:text-white border rounded px-2 py-1 w-full text-sm'
				value={value}
				onChange={e => onChange(e.target.value)}
			>
				{options.map(opt => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>
		)
	}

	return (
		<input
			type={type}
			className='bg-transparent text-primary-blue md:text-white border rounded px-2 py-1 w-full text-sm'
			value={safeValue}
			onChange={e => onChange(e.target.value)}
		/>
	)
}
