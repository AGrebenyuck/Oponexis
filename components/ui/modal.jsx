'use client'

import { AnimatePresence, motion } from 'framer-motion'

const Modal = ({ visible, onClose, children, footer, variant = 'default', closeLabel = 'Zamknij' }) => {
	if (!visible) return null
	const isConfirmation = variant === 'confirmation'

	const handleOverlayClick = e => {
		if (e.target.id === 'modal-overlay') {
			onClose()
		}
	}

	return (
		<AnimatePresence>
			{visible && (
				<div
					id='modal-overlay'
					className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
						isConfirmation ? 'bg-[#071827]/80 backdrop-blur-sm' : 'bg-black bg-opacity-50'
					}`}
					onClick={handleOverlayClick}
				>
					<motion.div
						initial={{ opacity: 0, scale: 0.96, y: 12 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.96, y: 12 }}
						transition={{ duration: 0.2, ease: 'easeOut' }}
						className={`w-full overflow-hidden ${
							isConfirmation
								? 'max-w-[480px] rounded-[28px] border border-white/15 bg-[#132C43] p-5 shadow-[0_28px_90px_rgba(0,0,0,.45)] sm:p-7'
								: 'max-w-[800px] rounded-lg bg-white p-4 shadow-lg'
						}`}
					>
						<div className='flex items-center justify-end'>
							<button
								type='button'
								onClick={onClose}
								aria-label='Zamknij okno'
								className={isConfirmation ? 'rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white' : ''}
							>
								<svg
									className='h-5 w-5'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2'
								>
									<path d='m6 6 12 12M18 6 6 18' />
								</svg>
							</button>
						</div>

						<div className={isConfirmation ? 'pt-1' : 'py-4'}>{children}</div>

						{footer ? <div className='mt-4 flex justify-end space-x-2 border-t pt-3'>{footer}</div> : null}
						{isConfirmation ? (
							<button
								type='button'
								onClick={onClose}
								className='mt-6 h-12 w-full rounded-xl bg-white px-5 font-bold text-primary-blue transition hover:bg-secondary-orange hover:text-white'
							>
								{closeLabel}
							</button>
						) : null}
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	)
}

export default Modal
