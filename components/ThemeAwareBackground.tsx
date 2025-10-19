'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import SpaceBackground from './SpaceBackground'

// Theme-aware palettes for SpaceBackground
const DARK_PALETTE = {
  bg1:'#080b16', bg2:'#111b35', bg3:'#1b2b5b',
  star:'rgba(255,255,255,0.95)',
  glow:'rgba(255,200,240,0.14)',        // keep if you like the cool contrast; see note below
  planetLight:'#FFDCCF',
  planetDark:'#E59682',
  nebula:'rgba(255,120,200,0.12)',
  ring:'rgba(255, 196, 170, 0.24)',     // ← Soft Coral Dust
  ship:'#ffffff',
  exhaust:'rgba(255,170,210,0.9)'
}

const LIGHT_PALETTE = {
  bg1: '#F7FAFF',  // base (lightest, bottom)
  bg2: '#EAF1FF',  // mid
  bg3: '#DDE8FF',  // top tint (keeps the cool-indigo sky feel)
  star: 'rgba(30, 45, 60, 0.85)',     // darker stars for light bg
  glow: 'rgba(0, 0, 0, 0.06)',        // subtle, not milky
  planetLight: '#FFEAE1',             // lighter, washed salmon highlight
  planetDark:  '#F3B9A7',             // gentle mid-tone shadow
  nebula: 'rgba(255, 165, 200, 0.12)',// warmer pink cloud, low sat
  ring:   'rgba(255, 205, 185, 0.22)',// soft coral ring to match
  ship: '#1E1E24',                    // dark ship for contrast
  exhaust: 'rgba(255, 170, 140, 0.70)'
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