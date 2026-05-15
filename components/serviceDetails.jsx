// components/serviceDetails.jsx

export function getDetailsContent(cardKey) {
	if (cardKey === 'Sezonowa wymiana kół') {
		return (
			<div className='space-y-2 text-xs sm:text-[13px]'>
				<h4 className='font-semibold text-secondary-orange mb-1'>
					Sezonowa wymiana kół
				</h4>
				<ul className='list-disc list-inside space-y-1 text-white'>
					<li>Masz dwa komplety kół: letnie i zimowe.</li>
					<li>
						Każde koło to opona + felga razem – gotowe do jazdy (kompletne
						koło).
					</li>
					<li>Mechanik zdejmuje cały zestaw kół i zakłada drugi.</li>
					<li>
						Nie ściągamy opony z felgi – nic nie jest rozbierane ani prasowane
						na maszynie.
					</li>
				</ul>
			</div>
		)
	}

	if (cardKey === 'Wymiana opon') {
		return (
			<div className='space-y-2 text-xs sm:text-[13px]'>
				<h4 className='font-semibold text-secondary-orange mb-1'>
					Wymiana opon
				</h4>
				<ul className='list-disc list-inside space-y-1 text-white'>
					<li>Masz jedne felgi, ale dwie różne opony (np. letnie i zimowe).</li>
					<li>
						Mechanik musi wykonać pełną usługę:
						<ol className='list-decimal list-inside ml-4 mt-1 space-y-0.5'>
							<li>Zdjąć starą oponę z felgi,</li>
							<li>Założyć nową oponę,</li>
							<li>Napompować i wyważyć koło.</li>
						</ol>
					</li>
					<li>To pełne „przełożenie gumy” na felgach.</li>
					<li>
						Usługa trwa dłużej i jest droższa, bo wymaga więcej pracy i
						specjalistycznego sprzętu.
					</li>
				</ul>
			</div>
		)
	}

	if (cardKey === 'Pomoc z oponą') {
		return (
			<div className='space-y-3 text-xs sm:text-[13px]'>
				<div>
					<h4 className='font-semibold text-secondary-orange mb-1'>
						Pomoc z oponą
					</h4>

					<ul className='list-disc list-inside space-y-1 text-white'>
						<li>Dokładnie sprawdzamy oponę i felgę.</li>
						<li>Lokalizujemy miejsce uszkodzenia.</li>
						<li>
							Wykonujemy profesjonalną naprawę, jeśli uszkodzenie pozwala na
							bezpieczną jazdę.
						</li>
						<li>
							Naprawa może obejmować łatki, wkłady lub naprawę od wewnątrz — w
							zależności od rodzaju uszkodzenia.
						</li>
						<li>Pompujemy koło i kontrolujemy ciśnienie.</li>
						<li>Jeśli jest taka potrzeba, możemy również wyważyć koło.</li>
					</ul>
				</div>

				<div className='rounded-xl border border-white/10 bg-white/5 p-3'>
					<p className='font-semibold text-white mb-1'>
						Gdy naprawa nie jest możliwa na miejscu:
					</p>

					<ul className='list-disc list-inside space-y-1 text-white/90'>
						<li>możemy wymienić koło na zapasowe, jeśli jest dostępne,</li>
						<li>
							pomożemy zorganizować dalszy serwis lub bezpieczne rozwiązanie.
						</li>
					</ul>
				</div>
				<div className='rounded-xl border border-secondary-orange/20 bg-secondary-orange/10 p-3'>
					<p className='font-semibold text-white mb-1'>
						Opona dojazdowa w nagłych sytuacjach
					</p>

					<p className='text-white/90 leading-relaxed'>
						Jeśli opona jest zbyt uszkodzona do bezpiecznej naprawy, możemy
						zapewnić oponę dojazdową, która pozwoli bezpiecznie dojechać do
						domu.
					</p>

					<p className='mt-2 text-secondary-orange font-semibold'>Cena 70 zł</p>
				</div>
			</div>
		)
	}

	return null
}
