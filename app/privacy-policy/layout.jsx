import ContactsSection from '@/components/ContactsSection'
import HeaderPanel from '@/components/headerPanel'

export const metadata = {
	title: 'Oponexis - Polityka prywatności',
	description: 'Polityka prywatności strony oponexis.pl',
}
const PrivacyPolicyLayout = ({ children }) => {
	return (
		<>
			<HeaderPanel />
			<main className='min-h-screen'>{children}</main>
			<ContactsSection />
		</>
	)
}

export default PrivacyPolicyLayout
