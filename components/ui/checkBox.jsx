import { forwardRef, useEffect, useState } from 'react'
import { CheckBoxCheckedIcon } from '../Icons'

const Checkbox = forwardRef(
	({ checked, onChange, disabled = false, label, className }, ref) => {
		const [isChecked, setIsChecked] = useState(checked ?? false)

		useEffect(() => {
			if (checked !== undefined) {
				setIsChecked(checked)
			}
		}, [checked])

		const handleChange = () => {
			if (disabled) return
			const newChecked = !isChecked
			setIsChecked(newChecked)
			onChange && onChange(newChecked)
		}

		return (
			<label className={`${className} flex items-center cursor-pointer gap-3`}>
				<input
					type='checkbox'
					checked={isChecked}
					onChange={handleChange}
					disabled={disabled}
					className='hidden'
					ref={ref}
				/>
				<div className='w-7 h-7 md:w-12 md:h-12 flex items-center shrink-0 justify-center border-2 rounded-full border-secondary-orange'>
					{isChecked && (
						<CheckBoxCheckedIcon className='block w-[16px] h-[11px] md:w-[29px] md:h-[21px]' />
					)}
				</div>
				{label && <span className='text-white font-semibold'>{label}</span>}
			</label>
		)
	}
)

export default Checkbox
