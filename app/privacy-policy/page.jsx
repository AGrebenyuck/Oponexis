import Button from '@/components/ui/button'
import Link from 'next/link'

const PrivacyPolicy = () => {
	return (
		<div className='container-padding flex flex-col'>
			<p className='text-center text-2xl font-bold'>Polityka prywatności</p>

			<h2 className='mt-6 font-bold'>I. Postanowienia ogólne</h2>
			<ol className='list-decimal list-inside space-y-2'>
				<li>
					Polityka prywatności określa, jak zbierane, przetwarzane i
					przechowywane są dane osobowe Użytkowników niezbędne do świadczenia
					usług drogą elektroniczną za pośrednictwem serwisu internetowego{' '}
					https://www.oponexis.pl (dalej: Serwis).
				</li>
				<li>
					Serwis zbiera wyłącznie dane osobowe niezbędne do świadczenia i
					rozwoju usług w nim oferowanych.
				</li>
				<li>
					Dane osobowe zbierane za pośrednictwem Serwisu są przetwarzane zgodnie
					z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 [...]
					oraz ustawą o ochronie danych osobowych z dnia 10 maja 2018 r.
				</li>
			</ol>

			<h2 className='mt-6 font-bold'>II. Administrator danych</h2>
			<p>
				Administratorem danych osobowych zbieranych poprzez Serwis jest{' '}
				OLEKSANDR ZABRODSKYI , adres: ul.Stefana Okrzei 7/8, 45-713, Opole, NIP:
				7543377801, REGON: 541389559, adres poczty elektronicznej:
				info@oponexis.pl (dalej: Administrator).
			</p>

			<h2 className='mt-6 font-bold'>III. Cel zbierania danych osobowych</h2>
			<ol className='list-decimal list-inside space-y-2'>
				<li>
					Dane osobowe wykorzystywane są w celu:
					<ul className='list-disc list-inside ml-4'>
						<li>przyjęcia i obsługi zgłoszenia lub rezerwacji usługi,</li>
						<li>
							kontaktu telefonicznego albo SMS w sprawie terminu i szczegółów
							zlecenia,
						</li>
						<li>
							realizacji mobilnych usług wulkanizacyjnych pod wskazanym
							adresem,
						</li>
						<li>
							przygotowania wizyty, w tym doboru sprzętu do auta, felg i opon,
						</li>
						<li>wystawienia faktury lub rachunku, jeśli Użytkownik o to poprosi,</li>
						<li>promocji oferty Administratora,</li>
						<li>działań analitycznych i statystycznych,</li>
						<li>windykacji należności,</li>
						<li>ustalenia i dochodzenia roszczeń albo obrony przed nimi.</li>
					</ul>
				</li>
				<li>
					Podanie danych jest dobrowolne, ale niezbędne do zawarcia umowy albo
					skorzystania z innych funkcjonalności Serwisu.
				</li>
			</ol>

			<h2 className='mt-6 font-bold'>
				IV. Rodzaj przetwarzanych danych osobowych
			</h2>
			<p>
				Administrator może przetwarzać dane podane przez Użytkownika, w
				szczególności: imię, numer telefonu, wybraną usługę, adres wykonania
				usługi, dane pojazdu, numer rejestracyjny, rozmiar felgi lub opony,
				uwagi do zlecenia, a w przypadku faktury także NIP i adres e-mail.
			</p>

			<h2 className='mt-6 font-bold'>
				V. Okres przetwarzania danych osobowych
			</h2>
			<p>Dane osobowe będą przetwarzane przez okres:</p>
			<ul className='list-disc list-inside ml-4'>
				<li>
					gdy podstawą przetwarzania jest umowa – do momentu przedawnienia
					roszczeń po jej wykonaniu,
				</li>
				<li>
					gdy podstawą jest zgoda – do momentu jej odwołania, a po odwołaniu do
					przedawnienia roszczeń.
				</li>
			</ul>
			<p>
				W obu przypadkach termin przedawnienia wynosi 6 lat, a dla roszczeń
				okresowych – 3 lata (chyba że przepis stanowi inaczej).
			</p>

			<h2 className='mt-6 font-bold'>VI. Udostępnianie danych osobowych</h2>
			<ol className='list-decimal list-inside space-y-2'>
				<li>
					Dane mogą być przekazywane podmiotom powiązanym z Administratorem,
					jego podwykonawcom, firmom obsługującym płatności, kurierom,
					kancelariom itd.
				</li>
				<li>Dane nie będą przekazywane poza EOG.</li>
			</ol>

			<h2 className='mt-6 font-bold'>VII. Prawa Użytkowników</h2>
			<ol className='list-decimal list-inside space-y-2'>
				<li>
					Użytkownik ma prawo do: dostępu, sprostowania, usunięcia,
					ograniczenia, przenoszenia, sprzeciwu i cofnięcia zgody.
				</li>
				<li>Żądanie należy przesłać na info@oponexis.pl.</li>
				<li>Administrator odpowiada maksymalnie w ciągu miesiąca.</li>
				<li>Użytkownik może złożyć skargę do UODO.</li>
			</ol>

			<h2 className='mt-6 font-bold'>VIII. Pliki cookies</h2>
			<ol className='list-decimal list-inside space-y-2'>
				<li>
					Serwis używa plików cookies – sesyjnych, stałych i podmiotów trzecich.
				</li>
				<li>
					Cookies wspierają poprawne działanie serwisu i służą statystyce.
				</li>
				<li>Użytkownik może zmieniać ustawienia cookies w przeglądarce.</li>
			</ol>

			<h2 className='mt-6 font-bold'>
				IX. Zautomatyzowane podejmowanie decyzji i profilowanie
			</h2>
			<ol className='list-decimal list-inside space-y-2'>
				<li>
					Dane nie będą przetwarzane w sposób zautomatyzowany w sposób
					skutkujący decyzją wobec Użytkownika.
				</li>
				<li>
					Dane mogą być profilowane w celu personalizacji po wyrażeniu zgody.
				</li>
			</ol>

			<h2 className='mt-6 font-bold'>X. Postanowienia końcowe</h2>
			<ol className='list-decimal list-inside space-y-2'>
				<li>
					Administrator ma prawo zmieniać politykę prywatności, bez ograniczania
					praw Użytkowników.
				</li>
				<li>Informacja o zmianach pojawi się w serwisie.</li>
				<li>
					W sprawach nieuregulowanych obowiązują przepisy RODO i prawa
					polskiego.
				</li>
			</ol>
			<Button className={'mt-4 mx-auto'}>
				<Link href={'/'}>Wróć na stronę</Link>
			</Button>
		</div>
	)
}

export default PrivacyPolicy
