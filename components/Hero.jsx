'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import HeroSlider from './HeroSlider'
import Button from './ui/button'

const handleClick = (e, targetId) => {
	e.preventDefault()

	document?.getElementById(targetId)?.scrollIntoView({
		behavior: 'smooth',
		block: 'start',
	})
}

const Hero = () => {
	const [bgImage, setBgImage] = useState('/background-header.jpg')
	const [isMobile, setIsMobile] = useState(true)

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth <= 768) {
				setBgImage('/bg-mobile.jpg')
			} else {
				setBgImage('/background-header.jpg')
			}
			if (window.innerWidth <= 1439) {
				setIsMobile(true)
			} else {
				setIsMobile(false)
			}
		}
		handleResize()
	}, [])
	return (
		<section className='relative max-h-[768px] h-full w-full'>
			<div className='absolute inset-0 z-0'>
				<Image
					src={bgImage}
					alt='Background'
					fill
					style={{
						objectFit: 'cover',
						objectPosition: 'center',
					}}
					quality={100}
				/>
			</div>
			<div className='px-4 pt-16 pb-10 sm:px-10 md:px-16 lg:py-28 2xl:py-48 md:pb-10 z-10 flex justify-between'>
				<div className='relative max-w-[910px]'>
					<h1 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 sm:mb-8 md:mb-11'>
						Zadbaj o swoje auto bez wychodzenia z domu !
					</h1>
					<p className='mb-10 sm:mb-11'>
						Nie musisz czekać na wolny termin w tradycyjnym warsztacie ani stać
						w korkach – Nasz mobilny serwis przyjedzie do ciebie .
					</p>
					<div className='flex flex-col gap-2 sm:flex-row sm:gap-5'>
						<Link href={'#services'} onClick={e => handleClick(e, 'services')}>
							<Button className='w-full'>Rezerwacja</Button>
						</Link>
						<Link href='tel:+48776888488'>
							<Button type='alternative' className='w-full'>
								Zadzwoń
							</Button>
						</Link>
					</div>
				</div>
				{!isMobile && <HeroSlider />}
			</div>
		</section>
	)
}

export default Hero
