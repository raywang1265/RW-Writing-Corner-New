'use client'

import { usePathname } from 'next/navigation'
import ThemeAwareBackground from './ThemeAwareBackground'

export default function GlobalBackground() {
  const pathname = usePathname()
  
  // Check if this is a blog post page (individual post)
  const isBlogPost = pathname.startsWith('/blog/') && 
    !pathname.endsWith('/blog') && 
    !pathname.includes('/page/') &&
    !pathname.includes('/tags/')
  
  // Don't show background on individual blog post pages
  if (isBlogPost) {
    return null
  }
  
  // Show background with blur on all other pages (except main page which has its own scroll-based blur)
  const isMainPage = pathname === '/'
  
  return (
    <ThemeAwareBackground 
      showBlur={!isMainPage} 
      blurIntensity={36}
    />
  )
}