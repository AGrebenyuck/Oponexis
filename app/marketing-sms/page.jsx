import Button from '@/components/ui/button'
import Link from 'next/link'

export const metadata = {
	title: 'Oponexis – marketingowe wiadomości SMS',
	description: 'Informacja o przetwarzaniu danych i zgodzie na marketingowe wiadomości SMS Oponexis.',
}

export default function MarketingSmsPage() {
	return (
		<div className='container-padding flex flex-col'>
			<h1 className='text-center text-2xl font-bold'>Informacja o marketingowych wiadomościach SMS</h1>
			<h2 className='mt-6 font-bold'>I. Czego dotyczy zgoda</h2>
			<p>Zgoda dotyczy otrzymywania od Oponexis marketingowych wiadomości SMS o ofertach własnych, usługach oraz sezonowych przypomnieniach. Jest dobrowolna i nie jest warunkiem wysłania zgłoszenia ani realizacji usługi.</p>
			<h2 className='mt-6 font-bold'>II. Administrator danych</h2>
			<p>Administratorem danych osobowych jest OLEKSANDR ZABRODSKYI, ul. Stefana Okrzei 7/8, 45-713 Opole, NIP: 7543377801, REGON: 541389559. Kontakt w sprawach danych osobowych: info@oponexis.pl.</p>
			<h2 className='mt-6 font-bold'>III. Zakres, cel i podstawa przetwarzania</h2>
			<p>W związku z wyrażeniem zgody przetwarzamy przede wszystkim numer telefonu, a gdy jest dostępny także identyfikator klienta i historię wyrażenia lub wycofania zgody. Dane wykorzystujemy wyłącznie do wysyłania własnych marketingowych wiadomości SMS.</p>
			<p>Podstawą przetwarzania jest zgoda (art. 6 ust. 1 lit. a RODO) oraz, w zakresie wymaganym dla komunikacji elektronicznej, uprzednia zgoda na przesyłanie informacji handlowej.</p>
			<h2 className='mt-6 font-bold'>IV. Odbiorcy i okres przechowywania</h2>
			<p>Dane mogą być przetwarzane przez podmioty świadczące na rzecz Oponexis usługi informatyczne, hostingowe i wysyłki SMS – wyłącznie na podstawie odpowiednich umów i poleceń Administratora.</p>
			<p>Zgoda obowiązuje do jej wycofania. Informację o udzieleniu lub wycofaniu zgody możemy zachować przez okres niezbędny do wykazania jej prawidłowego pozyskania oraz obrony przed ewentualnymi roszczeniami.</p>
			<h2 className='mt-6 font-bold'>V. Wycofanie zgody i prawa</h2>
			<p>Zgodę można wycofać w każdej chwili – bez wpływu na zgodność z prawem przetwarzania dokonanego przed jej wycofaniem – przez <Link className='font-semibold underline' href='/unsubscribe'>formularz rezygnacji z marketingowych SMS</Link> lub kontaktując się pod adresem info@oponexis.pl.</p>
			<p>Przysługuje Ci prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych, wniesienia sprzeciwu oraz złożenia skargi do Prezesa Urzędu Ochrony Danych Osobowych.</p>
			<h2 className='mt-6 font-bold'>VI. Dodatkowe informacje</h2>
			<p>Nie podejmujemy decyzji wyłącznie w sposób zautomatyzowany na podstawie samej zgody na marketingowe SMS. Pełne informacje o przetwarzaniu danych znajdują się w <Link className='font-semibold underline' href='/privacy-policy'>Polityce prywatności</Link>.</p>
			<Button className='mt-6 mx-auto'><Link href='/'>Wróć na stronę</Link></Button>
		</div>
	)
}
