import { cn } from '@/lib/utils'
import { StarIcon } from './Icons'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import ExpandableText from './ui/truncating'
import Truncating from './ui/truncating'

const ReviewCardHero = ({ review, className }) => {
	return (
		<div
			className={cn(
				'bg-white rounded-3xl p-6 text-primary-blue h-full',
				className
			)}
		>
			<div className='flex justify-between items-center mb-4 font-semibold gap-5'>
				<Avatar className='w-[105px] h-[105px]'>
					<AvatarImage src={review.image} />
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
				<p className='mr-auto'>{review.name}</p>
				<p className='flex gap-3 items-center'>
					{review.rate}
					<StarIcon />
				</p>
			</div>
			<div>
				<p className='font-semibold mb-3'>{review.title}</p>
				<Truncating text={review.text} maxLines={3} expandable />
			</div>
		</div>
	)
}

export default ReviewCardHero
