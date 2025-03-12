import Header from '@/components/Header'
import { plPL } from '@clerk/localizations'
import { ClerkProvider } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Montserrat, Nunito } from 'next/font/google'
import './globals.css'

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

export const metadata = {
	title: 'Oponexis',
	description: 'Mobile tire service',
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
					className={`${montserratRegular.variable} ${NunitoFont.variable} antialiased text-sm sm:text-xl lg:text-2xl 3xl:text-3xl font-normal overflow-x-hidden`}
				>
					<Header />
					<main>{children}</main>
					<Analytics />
					<SpeedInsights />
				</body>
			</html>
		</ClerkProvider>
	)
}
