'use client'

import { LINKS, SITE } from '@/lib/site'
import Image from 'next/image'
import { memo, useState } from 'react'
import HeroSlider from './HeroSlider'
import { PhoneIcon } from './Icons'
import Button from './ui/button'

const handleClick = (e, targetId) => {
	e.preventDefault()

	document?.getElementById(targetId)?.scrollIntoView({
		behavior: 'smooth',
		block: 'start',
	})
}

const Hero = memo(() => {
	const [isMobile, setIsMobile] = useState(true)

	return (
		<section
			data-hero
			aria-labelledby='hero-section'
			className='relative max-h-[768px] h-full w-full'
		>
			<h1 id='hero-section' className='sr-only'>
				Hero Section - Zadbaj o swoje auto bez wychodzenia z domu
			</h1>
			<picture className='absolute inset-0 z-0'>
				<source media='(max-width: 768px)' srcSet='/bg-mobile.jpg' />
				<source media='(min-width: 769px)' srcSet='/background-header.jpg' />
				<Image
					src={'/bg-mobile.jpg'}
					alt='Mobilny serwis opon - Zadbaj o swoje auto'
					fill
					style={{
						objectFit: 'cover',
						objectPosition: 'center',
					}}
					quality={80}
					priority={true}
				/>
			</picture>
			<div className='px-4 pt-16 pb-10 sm:px-10 md:px-16 lg:py-28 2xl:py-48 md:pb-10 z-10 flex justify-between'>
				<div className='relative max-w-[910px]'>
					<h1 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 sm:mb-8 md:mb-11'>
						Serwis mobilnej wulkanizacji w Opolu !
					</h1>
					<p className='mb-10 sm:mb-11'>
						Nie musisz czekać na wolny termin w tradycyjnym warsztacie ani stać
						w korkach – Nasz mobilny serwis przyjedzie do ciebie .
					</p>
					<div className='flex flex-col gap-2 sm:flex-row sm:gap-5'>
						<Button
							onClick={e => handleClick(e, 'reservation')}
							type='default'
							className='w-full'
						>
							Szybka Rezerwacja
						</Button>

						<a
							href={LINKS.PHONE_TEL}
							className='w-full inline-flex items-center justify-center rounded-xl lg:rounded-3xl transition-all px-6 py-2 md:px-10 md:py-3 lg:px-18 lg:py-5 text-white border border-white hover:fill-accent-blue 
							fill-white hover:bg-white hover:text-primary-blue'
						>
							<PhoneIcon className='w-4 h-4 md:w-5 md:h-5 mr-2 fill-inherit' />
							<span className='font-bold'>{SITE.PHONE_DISPLAY}</span>
						</a>
					</div>
				</div>
				{!isMobile && <HeroSlider />}
			</div>
		</section>
	)
})

export default Hero
