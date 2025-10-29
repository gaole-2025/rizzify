'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn, generateLQIP } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  priority?: boolean
  className?: string
  sizes?: string
  quality?: number
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className,
  sizes,
  quality = 80,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const placeholder = width && height ? generateLQIP(width, height) : undefined

  if (hasError) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-gray-800 text-gray-400',
        className
      )}>
        <span className="text-sm">Failed to load image</span>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      priority={priority}
      quality={quality}
      sizes={sizes}
      placeholder={placeholder ? 'blur' : undefined}
      blurDataURL={placeholder}
      className={cn(
        'transition-opacity duration-300',
        isLoading ? 'opacity-0' : 'opacity-100',
        className
      )}
      onLoad={() => setIsLoading(false)}
      onError={() => setHasError(true)}
      style={fill ? { objectFit: 'cover' } : undefined}
    />
  )
}