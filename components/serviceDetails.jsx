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
			<div className='space-y-2 text-xs sm:text-[13px]'>
				<h4 className='font-semibold text-secondary-orange mb-1'>
					Pomoc z oponą
				</h4>
				<ul className='list-disc list-inside space-y-1 text-white'>
					<li>Dojeżdżamy na miejsce.</li>
					<li>Sprawdzamy stan opony i felgi.</li>
					<li>
						Wykonujemy naprawę dojazdową (sznur naprawczy), żebyś mógł
						bezpiecznie dojechać.
					</li>
					<li>W razie potrzeby możemy założyć koło zapasowe (jeśli jest).</li>
				</ul>
			</div>
		)
	}

	return null
}
