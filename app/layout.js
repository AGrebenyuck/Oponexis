import Header from '@/components/Header'
import { plPL } from '@clerk/localizations'
import { ClerkProvider } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Montserrat, Nunito } from 'next/font/google'
import './globals.css'
import ContactsSection from '@/components/ContactsSection'

const montserratRegular = Montserrat({
	weight: ['400', '600', '700', '800'],
	subsets: ['latin'],
	variable: '--font-montserrat',
})
const NunitoFont = Nunito({
	weight: '600',
	subsets: ['latin'],
	variable: '--nunito-font',
})

// app/layout.js

export const metadata = {
	title: 'Oponexis - Wyjazdowy serwis opon i samochodów w Opolu',
	description:
		'Profesjonalny wyjazdowy serwis opon w Opolu. Wymiana opon, wyważanie, serwis klimatyzacji i inne usługi mobilne w Twoim mieście!',

	// Open Graph (OG) for social media sharing
	openGraph: {
		title: 'Oponexis - Wyjazdowy serwis opon i samochodów w Opolu',
		description:
			'Profesjonalny wyjazdowy serwis opon w Opolu. Wymiana opon, wyważanie, serwis klimatyzacji i inne usługi mobilne.',
		url: 'https://www.oponexis.pl',
		siteName: 'Oponexis',
		images: [
			{
				url: 'https://www.oponexis.pl/oponexis-og.JPG',
				width: 1200,
				height: 630,
				alt: 'Wyjazdowy serwis opon w Opolu',
			},
		],
		locale: 'pl_PL',
		type: 'website', // Site type (can be article, website, etc.)
	},

	// Twitter Card for rich snippets on Twitter
	twitter: {
		card: 'summary_large_image',
		title: 'Oponexis - Wyjazdowy serwis opon i samochodów w Opolu',
		description:
			'Oferujemy profesjonalny wyjazdowy serwis opon w Opolu, wymianę oleju, serwis klimatyzacji i inne usługi mobilne.',
		image: 'https://www.oponexis.pl/oponexis-og.JPG',
		site: '@oponexis', // Optional Twitter handle
	},

	// Robots meta tag for search engine crawling and indexing
	robots: 'index, follow', // Allow indexing and following links

	// Keywords for search engines (Although this is not as important as it used to be)
	keywords:
		'wyjazdowy serwis opon, wymiana opon Opole, serwis opon mobilny Opole, wyważanie opon Opole, serwis klimatyzacji Opole, wymiana oleju Opole, sezonowa wymiana opon Opole, magazynowanie opon Opole, przechowywanie opon Opole, wymiana opon w domu Opole, wymiana opon w pracy Opole, szybki serwis opon Opole, profesjonalna wymiana opon Opole, mobilny serwis opon Opole, opony letnie i zimowe Opole, serwis samochodowy Opole, tanie opony Opole, zakup opon Opole, naprawa opon Opole, serwis opon i felg Opole, warsztat Opole',

	// Additional tags for improving SEO and sharing
	metaTags: [
		{
			name: 'author',
			content: 'Oponexis Team',
		},
		{
			name: 'generator',
			content: 'Next.js',
		},
		{
			name: 'robots',
			content: 'index, follow', // Ensure the page is indexed
		},
	],

	// JSON-LD schema markup for Local Business (structured data)
	jsonLd: {
		'@context': 'http://schema.org',
		'@type': 'LocalBusiness',
		name: 'Oponexis',
		url: 'https://www.oponexis.pl',
		logo: 'https://www.oponexis.pl/logo.svg',
		sameAs: [
			'https://www.facebook.com/profile.php?id=61571688489971&locale=pl_PL',
		],
		address: {
			'@type': 'PostalAddress',
			addressLocality: 'Opole',
			addressRegion: 'Opolskie',
			postalCode: '45-000',
			addressCountry: 'PL',
		},
		openingHours: ['Mo-Fr 06:00-20:00', 'Sa 10:00-20:00', 'Su 10:00-20:00'],
		contactPoint: {
			'@type': 'ContactPoint',
			telephone: '+48 776 888 488',
			contactType: 'customer service',
			areaServed: 'PL',
			availableLanguage: 'pl',
		},
		description:
			'Oponexis to profesjonalny wyjazdowy serwis opon w Opolu. Oferujemy wymianę opon, wyważanie, serwis klimatyzacji i inne usługi mobilne.',
		image: 'https://www.oponexis.pl/oponexis-og.JPG',
	},

	// Social Media / Twitter Card related metadata
	twitterCard: {
		card: 'summary_large_image',
		title: 'Oponexis - Wyjazdowy serwis opon w Opolu',
		description:
			'Wymiana opon, serwis klimatyzacji, wymiana oleju i inne usługi mobilne w Opolu. Profesjonalna pomoc w każdym miejscu.',
		image: 'https://www.oponexis.pl/oponexis-og.jpg',
	},
}

export default function RootLayout({ children }) {
	return (
		<ClerkProvider
			localization={plPL}
			appearance={{
				elements: {
					card: 'bg-primary-blue text-white shadow-xl rounded-lg',
					headerTitle: 'text-xl font-bold text-center text-white',
					socialButtonsBlockButton: 'bg-blue-600 hover:bg-blue-700 text-white',
					dividerLine: 'bg-white',
					formFieldLabel: 'text-white',
					formButtonPrimary: 'bg-green-500 hover:bg-green-600',
					footerActionLink: 'text-blue-400 hover:text-blue-500',
					otpCodeFieldInput: 'shadow-otp text-white',
					formResendCodeLink: 'text-white',
					identityPreviewEditButton: 'text-white',
				},
			}}
		>
			<html lang='pl' className='overflow-x-hidden'>
				<head>
					<link rel='icon' href='/siteIcon/favicon.ico' type='x-icon' />
					<link rel='apple-touch-icon' href='/siteIcon/icon.svg'></link>
				</head>
				<body
					className={`${montserratRegular.variable} ${NunitoFont.variable} antialiased text-sm sm:text-xl lg:text-2xl 3xl:text-3xl font-normal overflow-x-clip`}
				>
					<Header />
					<main>{children}</main>
					<ContactsSection />
					<Analytics />
					<SpeedInsights />
				</body>
			</html>
		</ClerkProvider>
	)
}
