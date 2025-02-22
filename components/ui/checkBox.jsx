import { CheckBoxCheckedIcon } from '../Icons'

const Checkbox = ({
	checked,
	onChange,
	disabled = false,
	label,
	className,
}) => {
	return (
		<label
			className={`${className} flex items-center cursor-pointer gap-3 ${
				disabled ? 'opacity-50 cursor-not-allowed' : ''
			}`}
		>
			<input
				type='checkbox'
				checked={checked}
				onChange={onChange}
				disabled={disabled}
				className='hidden'
			/>
			<div
				className={`w-7 h-7 md:w-12 md:h-12 text-base flex flex-shrink-0 items-center justify-center border-2 rounded-full transition-all border-secondary-orange
				}`}
			>
				{checked && (
					<CheckBoxCheckedIcon className='block w-[16px] h-[11px] md:w-[29px] md:h-[21px]' />
				)}
			</div>
			{label && <span className='text-white font-semibold'>{label}</span>}
		</label>
	)
}

export default Checkbox
