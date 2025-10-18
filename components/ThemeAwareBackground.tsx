'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import SpaceBackground from './SpaceBackground'

// Theme-aware palettes for SpaceBackground
const DARK_PALETTE = {
  bg1:'#12080f', bg2:'#1e0f22', bg3:'#2d1438',
  star:'rgba(255,245,230,0.95)', glow:'rgba(255,210,170,0.16)',
  planetLight:'#ffcf9f', planetDark:'#a35b55',
  nebula:'rgba(255,140,120,0.12)', ring:'rgba(255,200,160,0.22)',
  ship:'#fff3e8', exhaust:'rgba(255,160,120,0.9)'
}

const LIGHT_PALETTE = {
  bg1:'#fff7ef', bg2:'#ffeadb', bg3:'#ffe0c9',
  star:'rgba(60,45,30,0.9)', glow:'rgba(0,0,0,0.06)',
  planetLight:'#ffc89d', planetDark:'#b6713f',
  nebula:'rgba(255,190,140,0.14)', ring:'rgba(240,170,120,0.22)',
  ship:'#2b2014', exhaust:'rgba(255,190,140,0.74)'
}

interface ThemeAwareBackgroundProps {
  showBlur?: boolean
  blurIntensity?: number
  className?: string
}

export default function ThemeAwareBackground({ 
  showBlur = false, 
  blurIntensity = 36,
  className = '' 
}: ThemeAwareBackgroundProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }
  
  // Select palette based on current theme
  const currentPalette = resolvedTheme === 'dark' ? DARK_PALETTE : LIGHT_PALETTE
  const planetTone = resolvedTheme === 'dark' ? -0.8 : 0.8

  return (
    <>
      <SpaceBackground 
        palette={currentPalette} 
        planetTone={planetTone}
        className={className}
      />
      {showBlur && (
        <div 
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            backdropFilter: `blur(${blurIntensity}px)`,
            WebkitBackdropFilter: `blur(${blurIntensity}px)`,
          }}
        />
      )}
    </>
  )
}