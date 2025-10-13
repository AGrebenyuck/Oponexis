// components/GoogleReviewsSlider.jsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { StarIcon } from './Icons' // твоя звезда
import Truncating from './ui/truncating' // ← используем для длинного текста

function Arrow({ dir = 'left' }) {
	return (
		<svg width='22' height='22' viewBox='0 0 24 24' fill='none' aria-hidden>
			{dir === 'left' ? (
				<path
					d='M15 18l-6-6 6-6'
					stroke='currentColor'
					strokeWidth='2'
					strokeLinecap='round'
					strokeLinejoin='round'
				/>
			) : (
				<path
					d='M9 6l6 6-6 6'
					stroke='currentColor'
					strokeWidth='2'
					strokeLinecap='round'
					strokeLinejoin='round'
				/>
			)}
		</svg>
	)
}

export default function GoogleReviewsSlider({
	api = '/api/google-reviews?limit=24&minRating=4',
}) {
	const [data, setData] = useState({
		rating: null,
		total: null,
		url: '#',
		reviews: [],
	})

	useEffect(() => {
		let ignore = false
		;(async () => {
			try {
				const res = await fetch(api, { cache: 'no-store' })
				const json = await res.json()
				if (!ignore && json?.ok) {
					const onlyText = (json.reviews || []).filter(
						r => (r.text || '').trim().length > 0
					)
					setData({ ...json, reviews: onlyText })
				}
			} catch (e) {
				console.error('reviews load failed', e)
			}
		})()
		return () => {
			ignore = true
		}
	}, [api])

	return (
		<section
			aria-labelledby='google-reviews'
			className='container-padding pt-8 pb-10 lg:pb-16 flex flex-col gap-6'
		>
			{/* Заголовок + бейдж */}
			<div className='flex items-center justify-between gap-3 flex-wrap'>
				<h2 id='google-reviews' className='title text-white'>
					Opinie klientów
				</h2>

				{data?.rating ? (
					<div className='flex items-center gap-3'>
						<Link
							href={data.url || '#'}
							target='_blank'
							className='inline-flex items-center gap-3 bg-white text-primary-blue rounded-full px-3 py-1.5'
							aria-label='Zobacz w Google'
						>
							{/* Google G */}
							<svg width='22' height='22' viewBox='0 0 48 48' aria-hidden>
								<path
									fill='#FFC107'
									d='M43.6 20.5H42V20H24v8h11.3C33.6 32.3 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.2 6.2 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10 0 19-7.3 19-20 0-1.2-.1-2.4-.4-3.5z'
								/>
								<path
									fill='#FF3D00'
									d='M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.2 6.2 29.4 4 24 4 16 4 9.1 8.6 6.3 14.7z'
								/>
								<path
									fill='#4CAF50'
									d='M24 44c5.1 0 9.8-1.9 13.3-5.1l-6.1-5.2C29.1 35.5 26.7 36 24 36c-5.2 0-9.6-3.7-11.2-8.6l-6.6 5.1C9.1 39.4 16 44 24 44z'
								/>
								<path
									fill='#1976D2'
									d='M43.6 20.5H42V20H24v8h11.3c-1 3-3.4 5.5-6.9 6.7l6.1 5.2C36.2 38.8 40 32.9 40 24c0-1.2-.1-2.4-.4-3.5z'
								/>
							</svg>
							<span className='flex items-center gap-1 font-semibold'>
								{Number(data.rating).toFixed(1)}
								<StarIcon className='w-[18px] h-[18px] fill-secondary-orange' />
							</span>
							<span className='text-primary-blue/70'>
								({data.total} opinii)
							</span>
						</Link>

						<Link
							href={data.url || '#'}
							target='_blank'
							className='inline-flex items-center gap-2 text-white/90 hover:text-white underline underline-offset-4'
						>
							Zobacz wszystkie opinie
						</Link>
					</div>
				) : null}
			</div>

			{/* Слайдер */}
			<div className='relative'>
				{/* Стрелки: только ≥ md */}
				<button
					className='custom-prev hidden md:flex absolute -left-12 top-1/2 -translate-y-1/2 z-[5] w-11 h-11 rounded-full bg-white text-primary-blue shadow items-center justify-center hover:scale-105 transition'
					aria-label='Poprzedni'
				>
					<Arrow dir='left' />
				</button>
				<button
					className='custom-next hidden md:flex absolute -right-12 top-1/2 -translate-y-1/2 z-[5] w-11 h-11 rounded-full bg-white text-primary-blue shadow items-center justify-center hover:scale-105 transition'
					aria-label='Następny'
				>
					<Arrow dir='right' />
				</button>

				<Swiper
					modules={[Navigation, Pagination]}
					navigation={{
						prevEl: '.custom-prev',
						nextEl: '.custom-next',
					}}
					pagination={{
						el: '.reviews-pagination', // кастомный контейнер снизу
						clickable: true,
					}}
					spaceBetween={24}
					slidesPerView={1}
					breakpoints={{
						768: { slidesPerView: 2, spaceBetween: 18 },
						1024: { slidesPerView: 3, spaceBetween: 24 },
						1440: { slidesPerView: 4, spaceBetween: 28 },
					}}
					loop
					className='!overflow-hidden'
				>
					{data.reviews.map(r => (
						<SwiperSlide key={r.id} className='!h-auto'>
							<article className='h-full bg-white rounded-3xl p-5 text-primary-blue flex flex-col'>
								{/* Шапка */}
								<div className='flex items-center gap-3 mb-3'>
									{r.profile_photo_url ? (
										<img
											src={r.profile_photo_url}
											alt={r.author_name || 'Użytkownik Google'}
											className='w-10 h-10 rounded-full object-cover'
											loading='lazy'
										/>
									) : (
										<div className='w-10 h-10 rounded-full bg-gray-200' />
									)}
									<div className='flex-1 min-w-0'>
										<div
											className='font-semibold truncate'
											title={r.author_name}
										>
											{r.author_name}
										</div>
										<div className='text-sm text-primary-blue/70'>
											{r.relative_time_description}
										</div>
									</div>
									<div className='ml-auto flex items-center gap-1 font-semibold'>
										{r.rating}
										<StarIcon className='w-[16px] h-[16px] fill-secondary-orange' />
									</div>
								</div>

								{/* Текст с усечением */}
								<div className='mt-1'>
									<Truncating
										text={r.text}
										expandable
										maxLines={6} // ~ фиксируем визуальную высоту
										moreLabel='Pokaż więcej'
										lessLabel='Pokaż mniej'
										className='text-[15px] leading-snug'
									/>
								</div>
							</article>
						</SwiperSlide>
					))}
				</Swiper>

				{/* Точки: только на мобилке */}
				<div className='reviews-pagination mt-4 flex justify-center md:hidden' />
			</div>

			{/* Стили для bullets (опционально, под твой стиль) */}
			<style jsx global>{`
				.reviews-pagination .swiper-pagination-bullet {
					width: 8px;
					height: 8px;
					opacity: 0.4;
					background: #fff;
					margin: 0 5px !important;
					transition: transform 0.2s, opacity 0.2s;
				}
				.reviews-pagination .swiper-pagination-bullet-active {
					opacity: 1;
					transform: scale(1.15);
					background: #fd6d02; /* твой акцентный оранжевый, если хочешь — оставь белый */
				}
			`}</style>
		</section>
	)
}
