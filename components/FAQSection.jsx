import Image from 'next/image'
import Accordion from './ui/acccordion'

const FAQSection = () => {
	const questions = [
		{
			title: 'Czy muszę być obecny podczas wykonywania usługi?',
			content:
				'Nie, nie jest to konieczne. Wystarczy, że wskażesz miejsce, gdzie znajduje się pojazd, oraz zapewnisz dostęp do kluczy i niezbędnych elementów. Resztą zajmiemy się sami.',
		},
		{
			title: 'Jak długo trwa wymiana opon lub kół?',
			content:
				'Standardowa wymiana opon lub kół trwa około 30–45 minut, w zależności od warunków i rodzaju pojazdu.',
		},
		{
			title: 'Czy oferujecie usługi poza Opolem?',
			content:
				'Tak, działamy również w okolicznych miejscowościach. Skontaktuj się z nami, aby ustalić szczegóły dojazdu.',
		},
		{
			title: 'Czy mogę przechowywać swoje opony u Was?',
			content:
				'Oczywiście! Oferujemy międzysezonowe przechowywanie opon w naszym magazynie, aby zaoszczędzić miejsce w Twoim domu lub garażu.',
		},
		{
			title: 'Jak mogę zapłacić za usługę?',
			content:
				'Akceptujemy różne formy płatności: gotówkę, kartę płatniczą , blik  lub przelew. Wybierz najwygodniejszą dla Ciebie opcję.',
		},
	]
	return (
		<div className='container-padding'>
			<h2 className='title'>Najczęściej zadawane pytania (FAQ)</h2>
			<div className='flex flex-col md:flex-row gap-12'>
				<div className='max-w-[856px] w-full'>
					<Accordion items={questions} />
				</div>
				<div className='relative w-full h-[200px] sm:h-[300px] md:h-[481px]'>
					<Image
						src='/faqBg.jpg'
						alt='faq bg'
						fill={true}
						style={{ objectFit: 'cover' }}
						className='rounded-3xl'
					/>
				</div>
			</div>
		</div>
	)
}

export default FAQSection
