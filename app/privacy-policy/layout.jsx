import ContactsSection from '@/components/ContactsSection'
import HeaderPanel from '@/components/headerPanel'

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
