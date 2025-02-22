import Image from 'next/image'
import {
	EconomyTimeIcon,
	MobilityIcon,
	OpenessIcon,
	ToolsIcon,
	WithoutParticipationIcon,
} from './Icons'

const OffersSection = () => {
	const advantages = [
		{
			id: 0,
			icon: (
				<MobilityIcon className='w-[61px] h-[57px] lg:w-[85px] lg:h-[81px]' />
			),
			title: 'Mobilność',
		},
		{
			id: 1,
			icon: (
				<EconomyTimeIcon className='w-[38px] h-[54px] lg:w-[60px] lg:h-[85px]' />
			),
			title: 'Oszczędność czasu',
		},
		{
			id: 2,
			icon: (
				<OpenessIcon className='w-[56px] h-[53px] lg:w-[85px] lg:h-[85px]' />
			),
			title: 'Transparentność',
		},
		{
			id: 3,
			icon: (
				<WithoutParticipationIcon className='w-[45px] h-[64px] lg:w-[63px] lg:h-[90px]' />
			),
			title: 'Bez Twojego udziału',
		},
		{
			id: 4,
			icon: <ToolsIcon className='w-[54px] h-[54px] lg:w-[81px] lg:h-[81px]' />,
			title: 'Nowoczesny sprzęt',
		},
	]
	return (
		<div className='container-padding pt-8'>
			<h2 className='title'>CO OFERUJEMY?</h2>
			<div className='flex flex-col 2xl:flex-row gap-5 mb-10 lg:gap-12 lg:mb-[64px]'>
				<div className='rounded-3xl 2xl:max-w-[863px] w-full '>
					<Image
						src='/offerImage.png'
						alt='offerBg'
						width={862}
						height={404}
						className='w-full'
					/>
				</div>
				<div className='w-full 2xl:max-w-[842px]'>
					<h3 className='text-xl mb-3 sm:text-2xl md:text-3xl lg:text-4xl  md:mb-5 lg:mb-8 font-semibold'>
						Dlaczego warto wybrać nas?
					</h3>
					<p className='tracking-[4%]'>
						Zostaliśmy stworzeni, aby oszczędzać twój czas i ułatwiać życie.
						Nasz mobilny zespół przyjedzie tam, gdzie tego potrzebujesz, wykona
						wszystkie usługi sprawnie i bez zbędnego zamieszania.
					</p>
				</div>
			</div>
			<div>
				<ul className='flex flex-wrap justify-around lg:justify-between xl:justify-around items-baseline gap-y-8 sm:gap-y-14'>
					{advantages.map(advantage => {
						return (
							<li
								key={advantage.id}
								className='flex flex-col gap-4 items-center w-[140px] sm:w-[40%] md:w-[150px] 2xl:w-auto max-w-[252px] text-center text-base md:text-lg lg:text-xl 2xl:text-3xl font-semibold'
							>
								{advantage.icon}
								<p>{advantage.title}</p>
							</li>
						)
					})}
				</ul>
			</div>
		</div>
	)
}

export default OffersSection
