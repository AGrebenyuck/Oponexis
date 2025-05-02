import {
	autoUpdate,
	flip,
	arrow as floatingArrow,
	offset,
	shift,
	useFloating,
} from '@floating-ui/react-dom'
import clsx from 'clsx'
import React, {
	cloneElement,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react'
import { createPortal } from 'react-dom'

const Popover = ({
	children,
	content,
	trigger = 'click',
	placement = 'top',
	open: controlledOpen,
	onOpenChange,
	confirm = false,
	title,
	description,
	onConfirm,
	onCancel,
	okText = 'OK',
	cancelText = 'Cancel',
	arrow = true,
	className = '',
}) => {
	const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
	const isControlled = controlledOpen !== undefined
	const isOpen = isControlled ? controlledOpen : uncontrolledOpen

	const arrowRef = useRef(null)

	const {
		refs,
		floatingStyles,
		update,
		placement: actualPlacement,
		middlewareData,
	} = useFloating({
		open: isOpen,
		onOpenChange: open => {
			if (!isControlled) setUncontrolledOpen(open)
			onOpenChange?.(open)
		},
		middleware: [
			offset(10),
			flip(),
			shift(),
			floatingArrow({ element: arrowRef }),
		],
		placement,
		whileElementsMounted: autoUpdate,
	})

	const show = () => {
		if (!isControlled) setUncontrolledOpen(true)
		onOpenChange?.(true)
	}

	const hide = () => {
		if (!isControlled) setUncontrolledOpen(false)
		onOpenChange?.(false)
	}

	const toggle = () => {
		if (!isControlled) setUncontrolledOpen(prev => !prev)
		onOpenChange?.(!isOpen)
	}

	const handleClickOutside = useCallback(
		e => {
			if (
				refs.floating.current &&
				!refs.floating.current.contains(e.target) &&
				refs.reference.current &&
				!refs.reference.current.contains(e.target)
			) {
				hide()
			}
		},
		[refs.floating, refs.reference]
	)

	useEffect(() => {
		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside)
		} else {
			document.removeEventListener('mousedown', handleClickOutside)
		}
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [isOpen, handleClickOutside])

	// Trigger props
	const child = React.Children.only(children)
	const triggerProps = {
		ref: refs.setReference,
	}

	if (trigger === 'click') {
		triggerProps.onClick = toggle
	} else if (trigger === 'hover') {
		triggerProps.onMouseEnter = show
		triggerProps.onMouseLeave = hide
	} else if (trigger === 'focus') {
		triggerProps.onFocus = show
		triggerProps.onBlur = hide
	}

	const staticSide = {
		top: 'bottom',
		right: 'left',
		bottom: 'top',
		left: 'right',
	}[actualPlacement.split('-')[0]]

	return (
		<>
			{cloneElement(child, triggerProps)}

			{isOpen &&
				createPortal(
					<div
						ref={refs.setFloating}
						style={floatingStyles}
						className={clsx(
							'absolute z-50 bg-white text-primary-blue border rounded-md shadow-lg p-3 text-sm max-w-64',
							className
						)}
					>
						{/* Стрелка */}
						{arrow && (
							<div
								ref={arrowRef}
								className='absolute w-3 h-3 bg-white border border-gray-200 border-l-0 border-t-0 rotate-45 z-[-1]'
								style={{
									left:
										middlewareData.arrow?.x != null
											? `${middlewareData.arrow.x}px`
											: '',
									top:
										middlewareData.arrow?.y != null
											? `${middlewareData.arrow.y}px`
											: '',
									[staticSide]: '-6px',
								}}
							/>
						)}

						{confirm ? (
							<>
								<div className='font-medium text-gray-900 mb-1'>{title}</div>
								{description && (
									<div className='text-gray-500 text-sm mb-3'>
										{description}
									</div>
								)}
								<div className='flex justify-end space-x-2'>
									<button
										className='px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200'
										onClick={() => {
											onCancel?.()
											hide()
										}}
									>
										{cancelText}
									</button>
									<button
										className='px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700'
										onClick={() => {
											onConfirm?.()
											hide()
										}}
									>
										{okText}
									</button>
								</div>
							</>
						) : (
							content
						)}
					</div>,
					document.body
				)}
		</>
	)
}

export default Popover
