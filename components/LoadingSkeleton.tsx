'use client'

export function MovieCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-cream-card border border-white/5 animate-pulse">
      <div className="w-full aspect-[2/3] shimmer" />
      <div className="p-2.5 space-y-2">
        <div className="h-3.5 shimmer rounded-md w-3/4" />
        <div className="flex justify-between">
          <div className="h-3 shimmer rounded-md w-1/3" />
          <div className="h-3 shimmer rounded-full w-8" />
        </div>
      </div>
    </div>
  )
}

export function CarouselSkeleton({ count = 7 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-none w-[140px] sm:w-[160px] md:w-[180px]">
          <MovieCardSkeleton />
        </div>
      ))}
    </div>
  )
}

export function PageSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function SectionSkeleton() {
  return (
    <div className="py-8 space-y-4">
      {/* Title skeleton */}
      <div className="flex justify-between items-center">
        <div className="h-7 shimmer rounded-lg w-48" />
        <div className="h-5 shimmer rounded-full w-16" />
      </div>
      {/* Carousel skeleton */}
      <CarouselSkeleton />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 shimmer rounded-full" />
        <div className="space-y-2">
          <div className="h-6 shimmer rounded-lg w-48" />
          <div className="h-4 shimmer rounded-md w-32" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card rounded-xl p-4 space-y-2">
            <div className="h-4 shimmer rounded-md w-1/2" />
            <div className="h-8 shimmer rounded-lg w-3/4" />
          </div>
        ))}
      </div>

      {/* Sections */}
      <SectionSkeleton />
      <SectionSkeleton />
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="h-4 shimmer rounded-md w-24" />
          <div className="h-10 shimmer rounded-xl w-full" />
        </div>
      ))}
      <div className="h-10 shimmer rounded-xl w-full mt-2" />
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-white/5">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 shimmer rounded-md" style={{ width: `${60 + (i * 13) % 30}%` }} />
        </td>
      ))}
    </tr>
  )
}

export function HeroSkeleton() {
  return (
    <div className="relative w-full h-[70vh] bg-cream-card overflow-hidden">
      <div className="absolute inset-0 shimmer" />
      <div className="absolute inset-0 flex flex-col justify-end p-12 space-y-4">
        <div className="h-12 shimmer rounded-xl w-2/3" />
        <div className="h-5 shimmer rounded-lg w-1/2" />
        <div className="flex gap-3">
          <div className="h-10 shimmer rounded-xl w-36" />
          <div className="h-10 shimmer rounded-xl w-36" />
        </div>
      </div>
    </div>
  )
}
