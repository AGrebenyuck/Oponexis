import { InfoIcon } from '../Icons'

const Result = ({ status = 'info', title, subTitle, icon, extra }) => {
	const statusStyles = {
		success: 'border border-secondary-orange/35 bg-secondary-orange/10 text-secondary-orange',
		error: 'bg-[#a93b32] text-white',
		info: 'bg-[#2c70b7] text-white',
		warning: 'bg-[#d68b00] text-white',
	}

	return (
		<div className='flex flex-col items-center px-2 pb-1 text-center'>
			{icon ? (
				<div className={`grid h-14 w-14 place-items-center rounded-2xl text-3xl shadow-[0_10px_28px_rgba(0,0,0,.2)] ${statusStyles[status]}`}>{icon}</div>
			) : (
				<div className={`grid h-14 w-14 place-items-center rounded-2xl shadow-[0_10px_28px_rgba(0,0,0,.2)] ${statusStyles[status]}`}>
					{status === 'success' ? (
						<svg aria-hidden className='h-6 w-6' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.25'>
							<path d='m5 12 4.2 4.2L19 6.8' strokeLinecap='round' strokeLinejoin='round' />
						</svg>
					) : (
						<span className='scale-90'>{status === 'error' && '✕'}{status === 'info' && <InfoIcon />}{status === 'warning' && '!'}</span>
					)}
				</div>
			)}
			<p className='mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-secondary-orange'>Oponexis</p>
			<h2 className='mt-2 text-2xl font-bold text-white sm:text-[28px]'>{title}</h2>
			{subTitle && (
				<p className='mt-3 max-w-sm text-[15px] leading-6 text-white/75'>{subTitle}</p>
			)}
			{/* The brand mark is deliberately a native SVG so it appears with the modal, not after image optimization. */}
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src='/logo.svg'
				alt='Oponexis'
				width='192'
				height='34'
				loading='eager'
				decoding='sync'
				className='mt-8 h-auto w-36'
			/>
			{extra && <div className='mt-5'>{extra}</div>}
		</div>
	)
}

export default Result
