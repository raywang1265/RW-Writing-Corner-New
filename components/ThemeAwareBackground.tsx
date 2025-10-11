'use client'

import { useTheme } from 'next-themes'
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
  bg1:'#fff4ec', bg2:'#ffe8db', bg3:'#ffdccc',
  star:'rgba(40,30,20,0.9)', glow:'rgba(0,0,0,0.06)',
  planetLight:'#ffbfa1', planetDark:'#d27a5f',
  nebula:'rgba(255,140,120,0.12)', ring:'rgba(230,110,100,0.22)',
  ship:'#1e1a18', exhaust:'rgba(255,150,110,0.75)'
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