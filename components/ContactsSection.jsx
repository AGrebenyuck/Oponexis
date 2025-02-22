import Image from 'next/image'
import Link from 'next/link'
import {
	FacebookIcon,
	LinkedInIcon,
	MailIcon,
	MarkIcon,
	PhoneIcon,
} from './Icons'

const ContactsSection = () => {
	return (
		<div className='container-padding'>
			<div className='relative'>
				<Link href='/'>
					<Image
						src='/logo.svg'
						alt='logo'
						width={321}
						height={56}
						className='w-[152px] md:w-[300px] lg:w-auto'
					/>
				</Link>
				<div className='flex flex-col flex-wrap 2xl:flex-nowrap md:flex-row gap-5 md:gap-10 justify-between mt-6 md:mt-12'>
					<div className='max-w-[607px] basis-2/4 2xl:basis-1/3'>
						<h4 className='title-2 font-semibold mb-3 md:mb-5'>
							My w mediach społecznościowych
						</h4>
						<p>
							Śledź nas na Facebooku i bądź na bieżąco z nowościami, promocjami
							i praktycznymi poradami!
						</p>
						<ul className='flex gap-3 md:relative md:mt-8 absolute top-0 right-0'>
							<li>
								<Link href='/'>
									<FacebookIcon className='w-8 h-8 md:w-12 md:h-12 lg:w-18 lg:h-18' />
								</Link>
							</li>
							<li>
								<Link href='/'>
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
							Pon–Pt: <span className='font-normal'>06:00–20:00 </span>
						</p>
						<p className='font-semibold'>
							Sob–Nd: <span className='font-normal'>10:00–20:00</span>
						</p>
					</div>
					<div className='order-2 2xl:order-3'>
						<h4 className='title-2 font-semibold mb-2 md:mb-4'>
							Skontaktuj się z nami
						</h4>
						<ul className='flex flex-col gap-2 md:gap-5'>
							<li>
								<Link href='/'>
									<div className='flex gap-5 md:gap-8 2xl:gap-11 items-center'>
										<MarkIcon className='w-[22px] h-[22px] md:w-[40px] md:h-[45px]' />
										<div>
											<h4 className='font-semibold'>Adres</h4>
											<h5>Opole</h5>
										</div>
									</div>
								</Link>
							</li>
							<li>
								<Link href='tel:+48776888488'>
									<div className='flex gap-5 md:gap-8 lg:gap-11 items-center'>
										<PhoneIcon className='w-[22px] h-[22px] md:w-[40px] md:h-[45px]' />
										<div>
											<h4 className='font-semibold'>Zadzwoń do nas</h4>
											<h5>+48776888488</h5>
										</div>
									</div>
								</Link>
							</li>
							<li>
								<Link href='mailto:info@oponexis.pl'>
									<div className='flex gap-5 md:gap-8 lg:gap-11 items-center'>
										<MailIcon className='w-[22px] h-[22px] md:w-[40px] md:h-[45px]' />
										<div>
											<h4 className='font-semibold'>Napisz do nas</h4>
											<h5>info@oponexis.pl</h5>
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
		</div>
	)
}

export default ContactsSection
