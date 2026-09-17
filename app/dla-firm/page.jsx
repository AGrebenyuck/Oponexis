import B2BLeadForm, { B2BCallLink, B2BOfferLink } from '@/components/B2BLeadForm'
import { SITE } from '@/lib/site'
import {
	ArrowLeft,
	Building2,
	CalendarDays,
	CarFront,
	FileText,
	MapPin,
	PhoneCall,
	UsersRound,
	Wrench,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const PAGE_URL = 'https://www.oponexis.pl/dla-firm'

export const metadata = {
	title: 'Mobilna wulkanizacja dla firm i flot w Opolu | Oponexis',
	description:
		'Mobilny serwis opon dla firm i flot w Opolu. Dojeżdżamy do Twojej firmy, ustalamy jeden termin i obsługujemy całą flotę na miejscu.',
	keywords: [
		'wulkanizacja floty Opole',
		'mobilna wulkanizacja dla firm',
		'serwis opon dla flot Opole',
		'wymiana opon flota samochodowa',
		'mobilny serwis opon B2B',
	],
	alternates: { canonical: PAGE_URL },
	openGraph: {
		title: 'Twoja flota zarabia w trasie, nie w kolejce do wulkanizacji',
		description: 'Mobilny serwis opon dla firm i flot w Opolu — obsługa na miejscu, w jednym terminie.',
		url: PAGE_URL,
		siteName: 'Oponexis',
		locale: 'pl_PL',
		type: 'website',
		images: [{ url: 'https://www.oponexis.pl/b2b-fleet-hero-final.webp', width: 1448, height: 1086, alt: 'Mobilny serwis opon Oponexis podczas obsługi floty Zoo Opole' }],
	},
	robots: { index: true, follow: true },
}

const BENEFITS = [
	{ icon: MapPin, value: 'Dojazd', label: 'do Twojej firmy' },
	{ icon: CarFront, value: '3–10 aut', label: 'podczas jednej wizyty' },
	{ icon: CalendarDays, value: 'Jeden termin', label: 'ustalony z wyprzedzeniem' },
	{ icon: FileText, value: 'Jedna faktura', label: 'za całą obsługę' },
	{ icon: UsersRound, value: 'Jeden kontakt', label: 'jasne zasady współpracy' },
]

const STEPS = [
	{ icon: PhoneCall, title: 'Kontakt', text: 'Zostaw numer lub zadzwoń.' },
	{ icon: CalendarDays, title: 'Termin', text: 'Ustalamy wygodny dzień i zakres prac.' },
	{ icon: Building2, title: 'Dojazd', text: 'Przyjeżdżamy bezpośrednio do firmy.' },
	{ icon: Wrench, title: 'Obsługa', text: 'Serwisujemy flotę na miejscu.' },
]

export default function B2BPage() {
	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Service',
		name: 'Mobilny serwis opon dla firm i flot',
		serviceType: 'Mobilna wulkanizacja i obsługa opon flot samochodowych',
		url: PAGE_URL,
		areaServed: { '@type': 'City', name: 'Opole' },
		provider: {
			'@type': 'LocalBusiness',
			name: 'Oponexis',
			url: 'https://www.oponexis.pl',
			telephone: SITE.PHONE_RAW,
			address: { '@type': 'PostalAddress', addressLocality: 'Opole', addressCountry: 'PL' },
		},
		description: metadata.description,
	}

	return (
		<div className='min-h-screen bg-[#0d263a] text-white'>
			<script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

			<header className='sticky top-0 z-50 border-b border-white/10 bg-[#0d263a]/90 backdrop-blur-xl'>
				<div className='mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 sm:px-8 lg:px-12'>
					<Link href='/' aria-label='Oponexis — strona główna'>
						<Image src='/logo.svg' alt='Oponexis' width={220} height={38} className='h-auto w-[126px] mobile:w-[142px] sm:w-[190px]' priority />
					</Link>
					<div className='flex items-center gap-2 sm:gap-4'>
						<Link href='/' className='hidden items-center gap-2 text-sm font-semibold text-white/70 transition hover:text-white sm:inline-flex'>
							<ArrowLeft aria-hidden className='h-4 w-4' /> Strona główna
						</Link>
						<B2BCallLink className='inline-flex h-10 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.07] px-3 text-[11px] font-bold text-white shadow-sm backdrop-blur transition hover:border-secondary-orange hover:bg-secondary-orange sm:h-11 sm:gap-2 sm:px-5 sm:text-sm [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-secondary-orange hover:[&>svg]:text-white'>
							+48 733 889 722
						</B2BCallLink>
					</div>
				</div>
			</header>

			<div>
				<section className='px-4 pb-0 pt-4 sm:px-8 sm:pt-8 lg:px-12'>
					<div className='relative mx-auto max-w-[1440px] overflow-hidden rounded-[28px] border border-white/10 bg-[#102f48] shadow-[0_30px_100px_rgba(2,13,23,0.32)] md:min-h-[650px] lg:min-h-[680px]'>
						<div className='relative aspect-[16/11] w-full md:hidden'>
							<Image
								src='/b2b-fleet-hero-final.webp'
								alt='Mobilny serwis Oponexis podczas obsługi floty Zoo Opole'
								fill
								priority
								sizes='100vw'
								className='object-cover'
							/>
							<div className='absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#102f48] to-transparent' />
						</div>
						<Image
							src='/b2b-fleet-hero-final.webp'
							alt='Mobilny serwis Oponexis podczas obsługi floty Zoo Opole'
							fill
							priority
							sizes='(max-width: 1440px) 100vw, 1440px'
							className='hidden object-cover object-center md:block'
						/>
						<div className='absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(6,26,41,0.98)_0%,rgba(6,26,41,0.9)_40%,rgba(6,26,41,0.28)_72%,rgba(6,26,41,0.05)_100%)] md:block' />
						<div className='absolute inset-x-0 bottom-0 hidden h-40 bg-gradient-to-t from-[#071c2c]/80 to-transparent md:block' />

						<div className='relative z-10 flex w-full min-w-0 max-w-[780px] flex-col justify-center px-6 pb-10 pt-2 md:min-h-[650px] md:px-12 md:py-14 lg:min-h-[680px] lg:px-16'>
							<p className='mb-5 text-xs font-bold uppercase tracking-[0.2em] text-secondary-orange sm:text-sm'>Mobilny serwis opon dla firm</p>
							<h1 className='max-w-full text-[2.1rem] font-extrabold leading-[1.04] tracking-[-0.035em] mobile:text-[2.35rem] sm:text-6xl lg:text-7xl'>
								Twoja flota zarabia w trasie, <span className='text-secondary-orange'>nie w kolejce</span> do wulkanizacji.
							</h1>
							<p className='mt-6 max-w-full text-sm leading-relaxed text-white/75 mobile:text-base sm:max-w-[640px] sm:text-xl'>
								Dojeżdżamy do Twojej firmy i obsługujemy całą flotę podczas jednej wizyty. Bez wyjazdów do warsztatu i zbędnych przestojów.
							</p>
							<div className='mt-8 flex flex-col gap-3 sm:flex-row'>
								<B2BCallLink className='inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-base font-bold text-primary-blue transition hover:bg-secondary-orange hover:text-white' />
								<B2BOfferLink className='inline-flex h-14 items-center justify-center rounded-2xl border border-white/25 bg-white/[0.06] px-6 text-base font-bold text-white backdrop-blur transition hover:bg-white/15'>
									Zapytaj o ofertę
								</B2BOfferLink>
							</div>
							<p className='mt-6 text-sm font-semibold text-white/65'>Opole i okolice · 3–10 samochodów · indywidualna wycena</p>
						</div>
					</div>
				</section>

				<section aria-label='Najważniejsze korzyści' className='mx-auto mt-5 max-w-[1340px] px-4 sm:mt-7 sm:px-8 lg:px-12'>
					<div className='grid grid-cols-2 gap-3 md:grid-cols-5'>
						{BENEFITS.map(({ icon: Icon, value, label }, index) => (
							<div key={value} className={`flex min-h-[118px] items-center gap-3 rounded-[20px] border border-white/10 bg-[#17364f] p-4 shadow-[0_12px_32px_rgba(3,15,26,0.18)] md:min-h-[150px] md:flex-col md:items-start md:gap-3 md:p-5 ${index === BENEFITS.length - 1 ? 'col-span-2 justify-center md:col-span-1 md:justify-start' : ''}`}>
								<span className='grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary-orange/15 text-secondary-orange'><Icon aria-hidden className='h-5 w-5' /></span>
								<div>
									<p className='text-base font-bold'>{value}</p>
									<p className='mt-0.5 text-xs leading-relaxed text-white/55'>{label}</p>
								</div>
							</div>
						))}
					</div>
				</section>

				<section className='mx-auto grid max-w-[1240px] gap-10 px-4 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_0.86fr] lg:items-center lg:gap-16 lg:px-12'>
					<div>
						<p className='text-xs font-bold uppercase tracking-[0.18em] text-secondary-orange'>Jak to działa?</p>
						<h2 className='mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl'>Cała flota. Jedna wizyta. Bez zbędnych dojazdów.</h2>
						<p className='mt-4 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg'>
							Ustalamy zakres prac i termin, a potem przyjeżdżamy z pełnym wyposażeniem prosto do Twojej firmy.
						</p>

						<div className='mt-8 grid gap-3 sm:grid-cols-2'>
							{STEPS.map(({ icon: Icon, title, text }, index) => (
								<div key={title} className='flex gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4'>
									<div className='grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-secondary-orange/30 bg-secondary-orange/10 text-secondary-orange'><Icon aria-hidden className='h-5 w-5' /></div>
									<div>
										<p className='text-xs font-bold text-secondary-orange'>0{index + 1}</p>
										<h3 className='mt-1 text-base font-bold'>{title}</h3>
										<p className='mt-1 text-sm leading-relaxed text-white/55'>{text}</p>
									</div>
								</div>
							))}
						</div>

						<div className='mt-6 rounded-2xl border border-secondary-orange/35 bg-secondary-orange/[0.08] p-4 text-sm leading-relaxed text-white/75'>
							<strong className='text-white'>Pierwsza obsługa bez zobowiązań.</strong> Sprawdź nas podczas jednej sezonowej wymiany.
						</div>
					</div>

					<B2BLeadForm />
				</section>
			</div>

			<footer className='border-t border-white/10'>
				<div className='mx-auto flex max-w-[1240px] flex-col gap-5 px-4 py-8 text-sm text-white/55 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12'>
					<div className='flex items-center gap-4'>
						<Image src='/logo.svg' alt='Oponexis' width={150} height={26} className='h-auto w-[130px]' />
						<span>Mobilna wulkanizacja dla firm w Opolu</span>
					</div>
					<div className='flex gap-5'>
						<Link href='/privacy-policy' className='transition hover:text-white'>Polityka prywatności</Link>
						<Link href='/' className='transition hover:text-white'>Strona główna</Link>
					</div>
				</div>
			</footer>
		</div>
	)
}
