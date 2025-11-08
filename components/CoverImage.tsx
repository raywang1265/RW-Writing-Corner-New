import Image, { ImageProps } from 'next/image'

interface CoverImageProps extends Omit<ImageProps, 'src' | 'alt' | 'width' | 'height'> {
  src: string
  alt: string
  /**
   * Maximum width of the cover image in pixels
   * Adjust this value to control the maximum size of the cover image
   * @default 1200
   */
  maxWidth?: number
  /**
   * Maximum height of the cover image in pixels
   * Adjust this value to control the maximum height of the cover image
   * @default 800
   */
  maxHeight?: number
  /**
   * Additional container classes for positioning/spacing
   * Adjust these to change the positioning and spacing around the image
   * Examples: "my-12" for more vertical space, "mx-4" for horizontal padding
   */
  containerClassName?: string
}

export default function CoverImage({
  src,
  alt,
  maxWidth = 1200,
  maxHeight = 800,
  containerClassName = '',
  className = '',
  ...rest
}: CoverImageProps) {
  return (
    <div
      className={`mt-12 mb-8 flex items-center justify-center px-4 ${containerClassName}`}
      // ADJUST SIZING: Change maxWidth value above (default: 1200px) to control max image width
      // ADJUST POSITIONING: Modify containerClassName (e.g., "my-12" for more space, "mx-4" for padding)
      style={{
        maxWidth: `${maxWidth}px`,
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
        minWidth: 0,
      }}
    >
      <div
        className="relative w-full [&>span]:block [&>span]:h-auto [&>span]:w-full [&>span]:max-w-full [&>span>img]:h-auto [&>span>img]:max-h-full [&>span>img]:w-full [&>span>img]:max-w-full [&>span>img]:object-contain"
        // ADJUST HEIGHT: Change maxHeight value above (default: 800px) to control max image height
        style={{
          maxHeight: `${maxHeight}px`,
          width: '100%',
          minWidth: 0,
        }}
      >
        <Image
          src={src}
          alt={alt}
          width={maxWidth}
          height={maxHeight}
          className={`h-auto w-full dark:invert ${className}`}
          // ADJUST DARK MODE: Change dark:invert to modify dark mode behavior
          // Options:
          //   - dark:invert (invert colors - current)
          //   - dark:brightness-75 (make darker)
          //   - dark:opacity-90 (fade slightly)
          //   - dark:grayscale (grayscale)
          //   - Remove dark: class for normal appearance
          style={{
            width: '100%',
            height: 'auto',
            maxWidth: '100%',
            maxHeight: `${maxHeight}px`,
            display: 'block',
            objectFit: 'contain',
          }}
          sizes={`(max-width: ${maxWidth}px) 100vw, ${maxWidth}px`}
          {...rest}
        />
      </div>
    </div>
  )
}
