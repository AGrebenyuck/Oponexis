import { cn } from '@/lib/utils'
import { StarIcon } from './Icons'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import Truncating from './ui/truncating'

const initials = (name = '') =>
	name
		.split(' ')
		.map(s => s[0])
		.slice(0, 2)
		.join('')
		.toUpperCase() || 'G'

export default function ReviewCardHero({
	review,
	compact = false,
	shadow = 'strong',
	textSize = 'md',
	className,
}) {
	const avatar = compact
		? 'w-[56px] h-[56px] xl:w-[68px] xl:h-[68px]'
		: 'w-[88px] h-[88px]'
	const cardH = compact ? 'h-[210px] xl:h-[260px]' : 'h-full'
	const shadowCls =
		shadow === 'strong'
			? 'shadow-[0_12px_28px_rgba(19,44,67,.40)]'
			: 'shadow-[0_10px_24px_rgba(19,44,67,.22)]'
	const bodyText =
		textSize === 'sm' ? 'text-[14px] leading-snug' : 'text-[15px] leading-snug'

	return (
		<div
			className={cn(
				'bg-white rounded-3xl p-5 text-primary-blue',
				cardH,
				shadowCls,
				className
			)}
		>
			<div className='flex items-center gap-3 mb-3'>
				<Avatar className={avatar}>
					<AvatarImage src={review.image} alt={review.name || 'Użytkownik'} />
					<AvatarFallback>{initials(review.name)}</AvatarFallback>
				</Avatar>
				<div className='min-w-0'>
					<p
						className='font-semibold truncate max-w-[180px] xl:max-w-[220px]'
						title={review.name}
					>
						{review.name}
					</p>
					<p className='text-primary-blue/70 text-sm'>Opinia Google</p>
				</div>
				<div className='ml-auto flex items-center gap-1 font-semibold shrink-0'>
					{review.rate}
					<StarIcon className='w-[16px] h-[16px] fill-secondary-orange' />
				</div>
			</div>
			<div className={bodyText}>
				<Truncating text={review.text} maxLines={3} expandable />
			</div>
		</div>
	)
}
