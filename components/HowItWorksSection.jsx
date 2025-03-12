import {
	HowItWorkBgIcon1,
	HowItWorkBgIcon2,
	HowItWorkBgIcon3,
	HowItWorkBgIcon4,
	HowItWorkNumberIcon1,
	HowItWorkNumberIcon2,
	HowItWorkNumberIcon3,
	HowItWorkNumberIcon4,
} from './Icons'

const steps = [
	{
		title: 'ZŁÓŻ ZGŁOSZENIE',
		text: 'Wybierz dogodny czas i miejsce',
		number: (
			<HowItWorkNumberIcon1 className='absolute right-[5%] w-[38px] h-[148px] 2xl:w-[76px] 2xl:h-[296px]' />
		),
		bg: (
			<HowItWorkBgIcon1 className='absolute sm:right-[95%] sm:translate-x-full right-2/4 translate-x-2/4 lg:right-2/4 lg:translate-x-2/4 2xl:right-[95%] 2xl:translate-x-full 3xl:right-2/4 3xl:translate-x-2/4 w-[117px] h-[142px] 2xl:w-[235px] 2xl:h-[284px]' />
		),
	},
	{
		title: 'PRZYJEŻDŻAMY',
		text: 'Szybko i bez zbędnych kłopotów.',
		number: (
			<HowItWorkNumberIcon2 className='absolute right-[5%] 3xl:right-[10%] w-[76px] h-[99px] 2xl:w-[152px] 2xl:h-[198px]' />
		),
		bg: (
			<HowItWorkBgIcon2 className='absolute  right-2/4 translate-x-2/4 sm:right-[95%] sm:translate-x-full lg:right-2/4 lg:translate-x-2/4 2xl:right-[95%] 2xl:translate-x-full 3xl:right-2/4 3xl:translate-x-2/4 w-[84px] h-[91px] 2xl:w-[168px] 2xl:h-[175px]' />
		),
	},
	{
		title: 'SERWISUJEMY',
		text: 'Profesjonalna naprawa lub wymiana',
		number: (
			<HowItWorkNumberIcon3 className='absolute right-[5%] 3xl:right-[10%] w-[75px] h-[99px] 2xl:w-[163px] 2xl:h-[225px]' />
		),
		bg: (
			<HowItWorkBgIcon3 className='absolute  right-2/4 translate-x-2/4 sm:right-[95%] sm:translate-x-full lg:right-2/4 lg:translate-x-2/4 2xl:right-[95%] 2xl:translate-x-full 3xl:right-2/4 3xl:translate-x-2/4  w-[84px] h-[84px] 2xl:w-[167px] 2xl:h-[168px]' />
		),
	},
	{
		title: 'I PO KŁOPOTACH',
		text: 'Teraz możesz skupić się na tym, co naprawdę ważne',
		number: (
			<HowItWorkNumberIcon4 className='absolute right-[5%] w-[88px] h-[150px] 2xl:w-[177px] 2xl:h-[301px]' />
		),
		bg: (
			<HowItWorkBgIcon4 className='absolute sm:right-[95%] sm:translate-x-full right-2/4 translate-x-2/4 lg:right-2/4 lg:translate-x-2/4 2xl:right-[95%] 2xl:translate-x-full 3xl:right-2/4 3xl:translate-x-2/4 w-[141px] h-[142px] 2xl:w-[282px] 2xl:h-[284px]' />
		),
	},
]

const HowItWorksSection = () => {
	return (
		<div id='howItWorks' className='container-padding'>
			<h2 className='title'>Jak to działa?</h2>
			<div className='grid grid-cols-1 grid-rows-3 lg:grid-rows-1 lg:grid-cols-3 3xl:grid-cols-[minmax(250px,540px)_auto_minmax(250px,540px)] gap-4 2xl:gap-6'>
				{/* Step 1 */}
				<div className='md:order-1 order-1 h-[269px] lg:h-[400px] 2xl:h-full'>
					<StepCard
						title={steps[0].title}
						description={steps[0].text}
						bgIcon={steps[0].bg}
						numberIcon={steps[0].number}
					/>
				</div>

				{/* Steps 2 & 3 - Vertical stack */}
				<div className='md:order-2 order-3 grid grid-rows-2 gap-4 2xl:gap-6 h-[269px] lg:h-full'>
					<StepCard
						title={steps[1].title}
						description={steps[1].text}
						bgIcon={steps[1].bg}
						numberIcon={steps[1].number}
					/>
					<StepCard
						title={steps[2].title}
						description={steps[2].text}
						bgIcon={steps[2].bg}
						numberIcon={steps[2].number}
					/>
				</div>

				{/* Step 4 */}
				<div className='md:order-3 order-4 h-[269px] lg:h-full'>
					<StepCard
						title={steps[3].title}
						description={steps[3].text}
						bgIcon={steps[3].bg}
						numberIcon={steps[3].number}
					/>
				</div>
			</div>
		</div>
	)
}

function StepCard({ title, description, bgIcon, numberIcon }) {
	return (
		<div className='relative border-2 border-[rgba(255,255,255,.3)] rounded-3xl pl-10 lg:pl-5 xl:pl-10 3xl:pl-20 2xl:pt-11 2xl:pb-16 h-full flex flex-col justify-center sm:items-center lg:items-start'>
			{/* Icons */}
			{bgIcon}
			{numberIcon}

			{/* Content */}
			<div className='relative z-10 max-w-[208px] 2xl:max-w-[300px] text-left sm:text-center lg:text-left'>
				<h3 className='text-lg lg:text-2xl 2xl:text-4xl font-extrabold mb-3 lg:mb-4 2xl:mb-6'>
					{title}
				</h3>
				<p className='font-semibold text-sm sm:text-base md:text-lg lg:text-xl 2xl:text-3xl'>
					{description}
				</p>
			</div>
		</div>
	)
}

export default HowItWorksSection
