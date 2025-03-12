'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { CheckBoxCheckedIcon } from '../Icons'

const ProgressIndicator = ({ step }) => {
	const containerRef = useRef(null)
	const [lineWidth, setLineWidth] = useState('50px')
	const [secondLineWidth, setSecondLineWidth] = useState('50px')

	useEffect(() => {
		if (containerRef.current) {
			const steps = containerRef.current.querySelectorAll('.step')
			if (steps.length > 1) {
				const firstStep = steps[0].getBoundingClientRect()
				const secondStep = steps[1].getBoundingClientRect()
				const thirdStep = steps[2].getBoundingClientRect()
				setLineWidth(`${secondStep.left - firstStep.right + firstStep.width}px`)
				setSecondLineWidth(
					`${thirdStep.left - secondStep.right + secondStep.width}px`
				)
			}
		}
	}, [step])

	return (
		<div
			ref={containerRef}
			className='flex items-center justify-between lg:justify-around  mb-10 lg:mb-16'
		>
			{[
				{ num: 1, text: 'Dane' },
				{ num: 2, text: 'Data' },
				{ num: 3, text: 'Podsumowanie' },
			].map((s, index) => (
				<div
					key={s.num}
					className='max-w-16 flex items-center flex-col gap-1 lg:gap-4'
				>
					<motion.div
						className={`step relative w-10 h-10 lg:w-16 lg:h-16 flex items-center justify-center rounded-full border-2 ${
							s.num <= step
								? 'bg-white border-white text-primary-blue'
								: 'bg-primary-blue border-white text-white'
						}`}
						initial={{ scale: 0.8, opacity: 0.5 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ duration: 0.3 }}
					>
						<motion.div
							initial={{ scale: 0, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ duration: 0.2 }}
						>
							{s.num < step ? (
								<CheckBoxCheckedIcon className='w-4 h-3 md:w-8 md:h-5 fill-primary-blue' />
							) : (
								s.num
							)}
						</motion.div>
						{index === 0 && (
							<motion.div
								initial={{ width: '20px', backgroundColor: '#757e8a' }}
								animate={{
									width: lineWidth,
									backgroundColor: s.num < step ? '#ffffff' : '#757e8a',
								}}
								transition={{ duration: 0.4 }}
								className='h-1 absolute left-0 z-[-1]'
							></motion.div>
						)}
						{index === 1 && (
							<motion.div
								initial={{ width: '20px', backgroundColor: '#757e8a' }}
								animate={{
									width: secondLineWidth,
									backgroundColor: s.num < step ? '#ffffff' : '#757e8a',
								}}
								transition={{ duration: 0.4 }}
								className='h-1 absolute left-0 z-[-1]'
							></motion.div>
						)}
					</motion.div>
					<p className='hidden lg:block'>{s.text}</p>
				</div>
			))}
		</div>
	)
}

export default ProgressIndicator
