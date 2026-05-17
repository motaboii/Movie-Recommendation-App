'use client'

import { useState } from 'react'

interface StarRatingProps {
  rating: number
  onRate?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  maxRating?: number
}

const sizeMap = {
  sm: { star: 'w-4 h-4', text: 'text-xs', gap: 'gap-0.5' },
  md: { star: 'w-5 h-5', text: 'text-sm', gap: 'gap-1' },
  lg: { star: 'w-7 h-7', text: 'text-base', gap: 'gap-1.5' },
}

function StarIcon({
  filled,
  half,
  className,
}: {
  filled: boolean
  half?: boolean
  className?: string
}) {
  if (half) {
    return (
      <span className={`relative inline-block ${className}`}>
        {/* Empty star base */}
        <svg className="w-full h-full text-slate-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        {/* Half-filled overlay */}
        <span className="absolute inset-0 overflow-hidden w-[50%]">
          <svg className="w-full h-full text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </span>
      </span>
    )
  }

  return (
    <svg
      className={`${className} ${
        filled
          ? 'text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.5)]'
          : 'text-slate-600'
      }`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

export default function StarRating({
  rating,
  onRate,
  readonly = false,
  size = 'md',
  showValue = true,
  maxRating = 10,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)
  const [selectedRating, setSelectedRating] = useState(rating)
  const [justSelected, setJustSelected] = useState(false)

  const displayRating = hoverRating || selectedRating
  const starCount = 5
  // Normalize to 5 stars
  const normalizedRating = (displayRating / maxRating) * starCount

  const { star, text, gap } = sizeMap[size]

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>, starIndex: number) => {
    if (readonly) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const half = x < rect.width / 2
    // Convert back to maxRating scale
    const hoverValue = half
      ? ((starIndex - 0.5) / starCount) * maxRating
      : (starIndex / starCount) * maxRating
    setHoverRating(hoverValue)
  }

  const handleClick = (starIndex: number, isHalf: boolean) => {
    if (readonly) return
    const value = isHalf
      ? ((starIndex - 0.5) / starCount) * maxRating
      : (starIndex / starCount) * maxRating
    setSelectedRating(value)
    setJustSelected(true)
    setTimeout(() => setJustSelected(false), 600)
    onRate?.(value)
  }

  const handleMouseLeave = () => {
    if (!readonly) setHoverRating(0)
  }

  const renderStars = () => {
    const stars = []
    for (let i = 1; i <= starCount; i++) {
      const filled = normalizedRating >= i
      const isHalf = !filled && normalizedRating >= i - 0.5
      const isHovering = !readonly && hoverRating > 0

      stars.push(
        <button
          key={i}
          type="button"
          disabled={readonly}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer'} transition-all duration-150 ${
            justSelected && i <= Math.ceil(normalizedRating) ? 'scale-125' : 'hover:scale-110'
          }`}
          onMouseMove={(e) => handleMouseMove(e, i)}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left
            handleClick(i, x < rect.width / 2)
          }}
          aria-label={`Rate ${i} star${i > 1 ? 's' : ''}`}
        >
          <StarIcon
            filled={filled || (isHovering && normalizedRating >= i)}
            half={isHalf && !(isHovering && normalizedRating >= i)}
            className={star}
          />
        </button>
      )
    }
    return stars
  }

  return (
    <div className={`flex items-center ${gap}`}>
      {renderStars()}
      {showValue && (
        <span className={`${text} font-medium text-charcoal-muted ml-1.5`}>
          {displayRating > 0
            ? displayRating % 1 === 0
              ? `${displayRating}.0`
              : displayRating.toFixed(1)
            : '—'}
          {maxRating !== 5 && <span className="text-slate-500">/{maxRating}</span>}
        </span>
      )}
    </div>
  )
}
