import FAQSection from '@/components/FAQSection'
import Hero from '@/components/Hero'
import HowItWorksSection from '@/components/HowItWorksSection'
import OffersSection from '@/components/OffersSection'
import ReservationSection from '@/components/ReservationSection'
import ServiceSection from '@/components/ServiceSection'
import TestimonialsSection from '@/components/TestimonialsSection'

export default function Home() {
	return (
		<>
			<Hero />
			<OffersSection />
			<HowItWorksSection />
			<ServiceSection />
			<ReservationSection />
			<TestimonialsSection />
			<FAQSection />
		</>
	)
}
