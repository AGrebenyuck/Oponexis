import { LINKS, SITE } from '@/lib/site'
import Image from 'next/image'
import Link from 'next/link'
import { memo } from 'react'
import {
	FacebookIcon,
	InstagramIcon,
	LinkedInIcon,
	MailIcon,
	MarkIcon,
	PhoneIcon,
} from './Icons'

const ContactsSection = memo(() => {
	return (
		<section id='contacts' className='container-padding'>
			<div className='relative'>
				<Link href='/'>
					<Image
						src='/logo.svg'
						alt='Oponexis - Wyjazdowy serwis opon'
						width={321}
						height={56}
						className='w-[152px] md:w-[300px] lg:w-auto'
						loading='lazy'
					/>
				</Link>
				<div className='flex flex-col flex-wrap 2xl:flex-nowrap md:flex-row gap-5 md:gap-10 justify-between mt-6 md:mt-12'>
					<div className='max-w-[607px] basis-2/4 2xl:basis-1/3'>
						<h4 className='title-2 font-semibold mb-3 md:mb-5'>
							My w mediach społecznościowych
						</h4>
						<p>
							Śledź nas w mediach i bądź na bieżąco z nowościami, promocjami i
							praktycznymi poradami!
						</p>
						<ul className='flex gap-3 md:relative md:mt-8 absolute top-0 right-0'>
							<li>
								<Link
									href='https://www.facebook.com/share/15No3dYV2d/?mibextid=wwXIfr'
									target='_blank'
								>
									<FacebookIcon className='w-8 h-8 md:w-12 md:h-12 lg:w-18 lg:h-18' />
								</Link>
							</li>
							<li>
								<Link
									href='https://www.instagram.com/oponexis.pl?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=='
									target='_blank'
								>
									<InstagramIcon className='w-8 h-8 md:w-12 md:h-12 lg:w-18 lg:h-18' />
								</Link>
							</li>
							<li>
								<Link
									href='https://www.linkedin.com/in/oleksandr-zabrodskyi-a1530034a'
									target='_blank'
								>
									<LinkedInIcon className='w-8 h-8 md:w-12 md:h-12 lg:w-18 lg:h-18' />
								</Link>
							</li>
						</ul>
					</div>
					<div className='order-3 2xl:order-2'>
						<h4 className='title-2 font-semibold mb-2 md:mb-4'>
							Godziny otwarcia:
						</h4>

						<p className='font-semibold'>
							Pon–Pt: <span className='font-normal'>12:00–20:00</span>
						</p>
						<p className='font-semibold'>
							Sob–Nd: <span className='font-normal'>12:00–20:00</span>
						</p>

						<p className='title-2 font-semibold my-2'>Dodatkowe opłaty:</p>
						<ul>
							<li>
								<span className='font-semibold'>+30%</span> w dni robocze poza
								godzinami 12:00–20:00
							</li>
							<li>
								<span className='font-semibold'>+50%</span> w soboty poza
								godzinami 12:00–20:00
							</li>
							<li>
								<span className='font-semibold'>+50%</span> w niedziele
								(niezależnie od godziny)
							</li>
						</ul>
					</div>
					<div className='order-2 2xl:order-3'>
						<h4 className='title-2 font-semibold mb-2 md:mb-4'>
							Skontaktuj się z nami
						</h4>
						<ul className='flex flex-col gap-2 md:gap-5'>
							<li>
								<Link
									href='https://maps.app.goo.gl/x7Jr3BnURYFCvCLw7'
									target='_blank'
								>
									<div className='flex gap-5 md:gap-8 2xl:gap-11 items-center'>
										<MarkIcon className='w-[22px] h-[22px] md:w-[40px] md:h-[45px]' />
										<div>
											<h4 className='font-semibold'>Adres</h4>
											<address>Opole</address>
										</div>
									</div>
								</Link>
							</li>
							<li>
								<a href={LINKS.PHONE_TEL}>
									<div className='flex gap-5 md:gap-8 lg:gap-11 items-center'>
										<PhoneIcon className='w-[22px] h-[22px] md:w-[40px] md:h-[45px]' />
										<div>
											<h4 className='font-semibold'>Zadzwoń do nas</h4>
											<h5>{SITE.PHONE_DISPLAY}</h5>
										</div>
									</div>
								</a>
							</li>
							<li>
								<Link href='mailto:info@oponexis.pl'>
									<div className='flex gap-5 md:gap-8 lg:gap-11 items-center'>
										<MailIcon className='w-[22px] h-[22px] md:w-[40px] md:h-[45px]' />
										<div>
											<h4 className='font-semibold'>Napisz do nas</h4>
											<h5>{SITE.EMAIL}</h5>
										</div>
									</div>
								</Link>
							</li>
						</ul>
					</div>
				</div>
			</div>
			<p className='text-secondary-orange mt-9 2xl:mt-[108px]'>
				2025 team Oponexis
			</p>
		</section>
	)
})

export default ContactsSection
