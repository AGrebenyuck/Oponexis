import ContactsSection from '@/components/ContactsSection'
import Header from '@/components/Header'

export default function MarketingLayout({ children }) {
	return (
		<>
			<Header />
			<main className='min-h-screen'>{children}</main>
			<ContactsSection />
		</>
	)
}
