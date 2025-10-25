'use client'

import { LINKS, SITE } from '@/lib/site'
import Image from 'next/image'
import { memo } from 'react'
import { PhoneIcon } from './Icons'
import SocialProof from './SocialProof'

const handleClick = (e, targetId) => {
	e.preventDefault()
	document
		?.getElementById(targetId)
		?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function BenefitPill({ children }) {
	return (
		<li className='flex items-center gap-2 text-white/95'>
			<span className='inline-block w-[10px] h-[10px] rounded-full bg-secondary-orange shadow-[0_0_0_3px_rgba(255,102,0,.18)]' />
			<span className='text-[15px] sm:text-[16px] font-semibold tracking-tight'>
				{children}
			</span>
		</li>
	)
}

const Hero = memo(({ initialReviews = null }) => {
	// ← принимаем проп
	return (
		<section
			id='hero'
			aria-labelledby='hero-title'
			className='relative overflow-hidden'
		>
			{/* BG */}
			<picture className='absolute inset-0 -z-10'>
				<source media='(max-width: 768px)' srcSet='/bg-mobile.jpg' />
				<source media='(min-width: 769px)' srcSet='/background-header.jpg' />
				<Image
					src='/bg-mobile.jpg'
					alt='Mobilny serwis opon'
					fill
					priority
					className='object-cover'
				/>
			</picture>
			<div className='absolute inset-0 pointer-events-none bg-gradient-to-b from-[#0c2437]/55 via-[#0c2437]/30 to-transparent' />

			<div className='px-4 pt-16 pb-10 sm:px-10 md:px-16 lg:py-20 2xl:py-28'>
				{/* 2 колонки на lg+ */}
				<div className='mx-auto max-w-[1200px] lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_400px]'>
					{/* LEFT */}
					<div className='max-w-[980px]'>
						<h1
							id='hero-title'
							className='font-extrabold leading-[1.05] text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white tracking-[-0.01em] drop-shadow-[0_1px_1px_rgba(0,0,0,.45)]'
						>
							Mobilna wulkanizacja
							<br />
							<span className='inline-block'>w&nbsp;Opolu</span>
						</h1>

						{/* подзаголовок */}
						<p className='mt-4 sm:mt-6 text-white text-base sm:text-lg md:text-xl max-w-[56ch] drop-shadow-[0_1px_1px_rgba(0,0,0,.35)]'>
							Zajmujemy się <b>wymianą i&nbsp;wyważeniem opon</b> pod Twoim
							domem lub w&nbsp;pracy.
						</p>

						{/* преимущества */}
						<div className='mt-5'>
							<div className='mb-2 text-[12px] tracking-widest uppercase text-white/70'>
								Nasze korzyści
							</div>
							<ul className='flex flex-wrap items-center gap-x-6 gap-y-2'>
								<BenefitPill>Darmowy dojazd tam, gdzie jesteś</BenefitPill>
								<BenefitPill>Cena jak w warsztacie</BenefitPill>
							</ul>
						</div>

						{/* CTA */}
						<div className='mt-7 sm:mt-8 w-full max-w-[740px]'>
							<div className='flex flex-col gap-2 md:flex-row md:flex-nowrap md:gap-4'>
								<button
									onClick={e => handleClick(e, 'reservation')}
									className='w-full md:w-auto md:flex-1 min-w-[260px] h-[54px] rounded-xl lg:rounded-3xl bg-white text-primary-blue text-lg md:text-xl font-medium whitespace-nowrap px-6 md:px-8 hover:bg-white/95 transition'
								>
									Szybka rezerwacja
								</button>
								<a
									href={LINKS.PHONE_TEL}
									className='w-full md:w-auto md:flex-1 min-w-[260px] h-[54px] inline-flex items-center justify-center text-lg md:text-xl font-medium whitespace-nowrap fill-white hover:fill-accent-blue rounded-xl lg:rounded-3xl px-6 md:px-8 text-white border border-white/80 hover:bg-white hover:text-primary-blue transition'
								>
									<PhoneIcon className='w-4 h-4 md:w-5 md:h-5 mr-2 fill-inherit' />
									<span>{SITE.PHONE_DISPLAY}</span>
								</a>
							</div>
						</div>
					</div>

					{/* RIGHT — SocialProof панель.
              ВАЖНО: НЕ оборачивать сюда контейнеры с opacity — иначе «solid» бейдж сереет */}
					<div className='hidden lg:block'>
						<SocialProof
							initialData={initialReviews} // ← SSR данные
						/>
					</div>
				</div>
			</div>

			{/* Моб. бейдж под хедером (glass), тоже с SSR данными */}
			<div className='absolute top-3 right-3 sm:top-4 sm:right-4 lg:hidden'>
				<SocialProof variant='badge' initialData={initialReviews} />
			</div>
		</section>
	)
})

export default Hero
