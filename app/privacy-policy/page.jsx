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
						<li>rejestracji konta i weryfikacji tożsamości Użytkownika,</li>
						<li>umożliwienia logowania do Serwisu,</li>
						<li>realizacji umowy dotyczącej usług i e-usług,</li>
						<li>
							komunikacji z Użytkownikiem (livechat, formularz kontaktowy itp.),
						</li>
						<li>wysyłki newslettera (po wyrażeniu zgody),</li>
						<li>prowadzenia systemu komentarzy,</li>
						<li>świadczenia usług społecznościowych,</li>
						<li>promocji oferty Administratora,</li>
						<li>marketingu, remarketingu, afiliacji,</li>
						<li>personalizacji Serwisu,</li>
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
				Administrator może przetwarzać dane osobowe Użytkownika: imię i
				nazwisko, data urodzenia, adres zamieszkania, adres e-mail, numer
				telefonu, NIP.
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
				<Link href={'/'}>Wrócić na strone</Link>
			</Button>
		</div>
	)
}

export default PrivacyPolicy
