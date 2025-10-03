import FAQSection from '@/components/FAQSection'
import Hero from '@/components/Hero'
import HowItWorksSection from '@/components/HowItWorksSection'
import OffersGrid from '@/components/OfferGrid'
import QuickReservation from '@/components/QuickReservation'
import TestimonialsSection from '@/components/TestimonialsSection'
import FloatingCallButton from '@/components/ui/floatingCallButton'

export default function Home() {
	return (
		<>
			<Hero />
			<OffersGrid />
			{/* <OffersSection /> */}
			<HowItWorksSection />
			<QuickReservation />
			{/* <ServiceSection /> */}
			{/* <ReservationSection /> */}
			<TestimonialsSection />
			<FAQSection />
			<FloatingCallButton />
		</>
	)
}
