'use client'

import Image from 'next/image'
import { memo, useRef, useState } from 'react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { SliderArrowLeftIcon, SliderArrowRightIcon, StarIcon } from './Icons'
import Truncating from './ui/truncating'

const TestimonialSlider = memo(() => {
	const reviews = [
		{
			image: '/avatar/1.jpg',
			name: 'Marek Kowalski',
			rating: 5,
			service: 'Wymiana opon sezonowa',
			comment:
				'Świetna sprawa! Mechanik przyjechał na czas, wymienił opony w ekspresowym tempie. Zero stresu, na pewno skorzystam ponownie.',
		},
		{
			image: '/avatar/2.jpg',
			name: 'Piotr Nowak',
			rating: 4,
			service: 'Wymiana oleju',
			comment:
				'Dobra usługa, ale małe opóźnienie. Poza tym wszystko w porządku, mechanik zna się na rzeczy. Wygodne rozwiązanie dla zapracowanych.',
		},
		{
			image: '/avatar/3.jpg',
			name: 'Tomasz Zieliński',
			rating: 5,
			service: 'Serwis klimatyzacji',
			comment:
				'Klimatyzacja działa jak nowa! Wcześniej ledwo chłodziła, teraz jest super. Szybka i profesjonalna robota, polecam!',
		},
		{
			image: '/avatar/4.jpg',
			name: 'Andrzej Wiśniewski',
			rating: 4,
			service: 'Wymiana kół',
			comment:
				'Szybko, sprawnie i bez problemów. Mogłoby być trochę taniej, ale oszczędność czasu rekompensuje cenę. Wygodna opcja!',
		},
		{
			image: '/avatar/5.jpg',
			name: 'Paweł Lewandowski',
			rating: 5,
			service: 'Wymiana oleju',
			comment:
				'Genialna usługa! Mechanik przyjechał pod blok, wymienił olej w 15 minut. Warto zapłacić za taką wygodę.',
		},
		{
			image: '/avatar/6.jpg',
			name: 'Krzysztof Dąbrowski',
			rating: 5,
			service: 'Serwis klimatyzacji',
			comment: 'Super👍',
		},
		{
			image: '/avatar/7.jpg',
			name: 'Marcin Szymański',
			rating: 5,
			service: 'Wymiana opon sezonowa',
			comment:
				'Super opcja! Wymiana opon bez ruszania się z domu, oszczędność czasu i nerwów. Polecam każdemu!',
		},
		{
			image: '/avatar/8.jpg',
			name: 'Adam Jankowski',
			rating: 4,
			service: 'Wymiana kół',
			comment:
				'Dobry serwis, wszystko poszło sprawnie. Cena mogłaby być nieco niższa, ale wygoda i oszczędność czasu na plus.',
		},
	]

	const swiperRef = useRef(null)
	const [isBeginning, setIsBeginning] = useState(true)
	const [isEnd, setIsEnd] = useState(false)

	const updateNavigationState = swiper => {
		setIsBeginning(swiper.isBeginning)
		setIsEnd(swiper.isEnd)
	}

	return (
		<section aria-labelledby='testimonial-slider'>
			<h2 id='testimonial-slider' className='sr-only'>
				Opinie klientów
			</h2>
			<Swiper
				modules={[Navigation, Pagination]}
				spaceBetween={29}
				slidesPerView={3} // Отображается 3 слайда
				slidesPerGroup={1} // Прокрутка по 1 слайду
				navigation={{
					prevEl: '.custom-prev',
					nextEl: '.custom-next',
				}}
				breakpoints={{
					0: {
						slidesPerView: 1,
						slidesPerGroup: 1,
						pagination: {
							el: '.custom-pagination',
							clickable: true,
							renderBullet: (index, className) => {
								return `<span class="${className}"></span>`
							},
						},
					},
					768: {
						spaceBetween: 15,
						slidesPerView: 2,
						slidesPerGroup: 1,
						pagination: {
							el: '.custom-pagination',
							clickable: true,
							renderBullet: (index, className) => {
								return `<span class="${className}"></span>`
							},
						},
					},
					1024: {
						slidesPerView: 3,
						slidesPerGroup: 1, // Прокрутка по 1 слайду на экранах от 1024px
						pagination: false,
					},
				}}
				onSwiper={swiper => {
					swiperRef.current = swiper
					updateNavigationState(swiper)
				}}
				onSlideChange={swiper => updateNavigationState(swiper)}
			>
				{reviews.map((review, index) => {
					return (
						<SwiperSlide
							key={index}
							className='px-6 py-5 md:p-7 bg-white rounded-3xl text-primary-blue flex flex-col h-full'
						>
							<div className='flex lg:flex-col 2xl:flex-row items-center mobile:justify-center md:justify-between gap-5 2xl:gap-7 mb-6'>
								<div className='relative flex-shrink-0 w-[63px] h-[61px]  3xl:w-[105px] 3xl:h-[102px] text-primary-blue'>
									<Image
										src={review.image}
										fill={true}
										alt={'zdjęcie klienta ' + review.name}
										style={{
											objectFit: 'cover',
											objectPosition: 'center',
											borderRadius: '50%',
										}}
										loading='lazy'
										sizes='(max-width: 768px) 63px, (min-width: 1024px) 105px'
									/>
								</div>
								<div className='flex gap-2 w-full mobile:w-auto justify-between mobile:justify-normal md:w-full 2xl:w-full'>
									<div className='md:mr-auto'>
										<h4 className='font-semibold mb-1 text-base md:text-lg xl:text-xl'>
											{review.name}
										</h4>
										<h5 className='font-medium md:text-base xl:text-xl'>
											{review.service}
										</h5>
									</div>
									<div className='flex gap-1 2xl:gap-3 items-center'>
										<p className='font-semibold text-base lg:text-xl 2xl:text-3xl mt-1 lg:mt-2'>
											{review.rating}
										</p>
										<StarIcon className='w-[23px] h-[22px] lg:w-[40px] lg:h-[40px] 2xl:w-[60px] 2xl:h-[59px] fill-secondary-orange' />
									</div>
								</div>
							</div>
							<Truncating
								text={review.comment}
								expandable
								className='tracking-[4%] md:text-base lg:text-xl'
							/>
						</SwiperSlide>
					)
				})}

				{/* Навигационные кнопки */}
				<div className='justify-end gap-7 hidden lg:flex mt-12 mr-1'>
					<button
						className={`custom-prev
          transition-all duration-300 
          ${
						isBeginning
							? 'opacity-50 cursor-not-allowed'
							: 'hover:scale-110 hover:text-black'
					}
        `}
						onClick={() => swiperRef.current?.slidePrev()}
						disabled={isBeginning}
					>
						<SliderArrowLeftIcon />
					</button>

					{/* Правая кнопка */}
					<button
						className={`custom-next transition-all duration-300
          ${
						isEnd
							? 'opacity-50 cursor-not-allowed'
							: 'hover:scale-110 hover:text-black'
					}
        `}
						onClick={() => swiperRef.current?.slideNext()}
						disabled={isEnd}
					>
						<SliderArrowRightIcon />
					</button>
				</div>

				{/* Пагинация на мобильных */}
				<div className='custom-pagination mt-5 flex justify-center lg:hidden'></div>
			</Swiper>
		</section>
	)
})

export default TestimonialSlider
