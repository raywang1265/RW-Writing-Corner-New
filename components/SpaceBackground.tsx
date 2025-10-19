'use client'

import { useEffect, useRef } from 'react'

type Palette = {
  bg1: string
  bg2: string
  bg3: string
  star: string
  glow: string
  planetLight: string
  planetDark: string
  nebula: string
  ring: string
  ship: string
  exhaust: string
}

const DEFAULTS: Palette = {
  bg1: '#130531',
  bg2: '#2a0b5b',
  bg3: '#3a0f78',
  star: 'rgba(255,255,255,0.9)',
  glow: 'rgba(255,255,255,0.15)',
  planetLight: '#d3a6ff',
  planetDark: '#6a4ab2',
  nebula: 'rgba(186,119,255,0.14)',
  ring: 'rgba(255,160,255,0.22)',
  ship: '#ffffff',
  exhaust: 'rgba(255,180,120,0.9)',
}

export default function SpaceBackground({
  palette = DEFAULTS,
  density = 0.00012,
  motion = 1.8,
  shipMinDelay = 3,
  shipMaxDelay = 7,
  speedScale = 0.75, // slower overall by default
  className = '',
  planetTone = 0,
}: {
  palette?: Palette
  density?: number
  motion?: number
  shipMinDelay?: number
  shipMaxDelay?: number
  speedScale?: number
  className?: string
  planetTone?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })!
    if (!ctx) return

    let w = 0,
      h = 0,
      raf = 0
    let frameCount = 0
    let lastSec = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      init()
    }

    type Star = { x: number; y: number; z: number; r: number; tw: number }
    let stars: Star[] = []
    let noiseTex: HTMLCanvasElement | null = null

    // deterministic RNG for stable star layout
    let seed = 42
    const rnd = () => {
      seed ^= seed << 13
      seed ^= seed >> 17
      seed ^= seed << 5
      return ((seed >>> 0) % 1000) / 1000
    }
    const frand = (a: number, b: number) => a + (b - a) * Math.random()

    const makeNoise = (size = 128) => {
      const n = document.createElement('canvas')
      n.width = size
      n.height = size
      const nctx = n.getContext('2d')!
      const img = nctx.createImageData(size, size)
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 220 + Math.floor(Math.random() * 35)
        img.data[i] = v
        img.data[i + 1] = v
        img.data[i + 2] = v
        img.data[i + 3] = Math.random() * 10
      }
      nctx.putImageData(img, 0, 0)
      return n
    }

    const init = () => {
      const target = Math.floor(w * h * density)
      stars = []
      seed = 42
      for (let i = 0; i < target; i++) {
        stars.push({
          x: rnd() * w,
          y: rnd() * h,
          z: 0.5 + rnd() * 1.5,
          r: 0.6 + rnd() * 1.6,
          tw: rnd() * Math.PI * 2,
        })
      }
      if (!noiseTex) noiseTex = makeNoise()
      scheduleNextShip(0)
    }

    const radial = (cx: number, cy: number, r: number, c0: string, c1: string) => {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      g.addColorStop(0, c0)
      g.addColorStop(1, c1)
      return g
    }

    const drawBackground = () => {
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, palette.bg3)
      g.addColorStop(0.55, palette.bg2)
      g.addColorStop(1, palette.bg1)
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = radial(w * 0.5, h * 0.55, Math.max(w, h), 'rgba(0,0,0,0)', 'rgba(0,0,0,0.5)')
      ctx.fillRect(0, 0, w, h)
    }

    const drawPlanetAndStaticRing = (sec: number) => {
      const off = Math.sin(sec * 0.14 * motion) * 12
      const cx = w * 0.66 + off
      const cy = h * 0.42 + off * 0.5
      const R = Math.min(w, h) * 0.38

      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      const g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R)
      g.addColorStop(0, palette.planetLight)
      g.addColorStop(1, palette.planetDark)
      ctx.fillStyle = g
      ctx.globalAlpha = 0.9
      ctx.fill()

      const tone = Math.max(-0.5, Math.min(0.5, planetTone)) // clamp
      if (tone !== 0) {
        ctx.globalAlpha = Math.abs(tone)
        ctx.fillStyle = tone > 0 ? '#ffffff' : '#000000'
        ctx.beginPath()
        ctx.arc(cx, cy, R, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      ctx.globalAlpha = 0.11
      ctx.strokeStyle = '#fff'
      for (let i = -R * 0.8; i <= R * 0.8; i += R * 0.07) {
        ctx.beginPath()
        ctx.ellipse(cx, cy + i * 0.06, R * 1.1, R * 0.32, 0.25, 0, Math.PI * 2)
        ctx.stroke()
      }

      ctx.globalAlpha = 0.6
      ctx.fillStyle = radial(
        cx + R * 0.2,
        cy - R * 0.1,
        R * 1.2,
        'rgba(0,0,0,0)',
        'rgba(0,0,0,0.6)'
      )
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      const tilt = -0.3
      const rx = R * 1.35
      const ry = R * 0.42

      ctx.save()
      ctx.translate(cx, cy)
      ctx.globalCompositeOperation = 'lighter'
      ctx.strokeStyle = palette.ring

      ctx.globalAlpha = 1
      ctx.lineWidth = Math.max(1, R * 0.055)
      ctx.beginPath()
      ctx.ellipse(0, 0, rx, ry, tilt, Math.PI * 0.12, Math.PI * 1.12)
      ctx.stroke()

      ctx.globalAlpha = 0.55
      ctx.lineWidth = Math.max(0.5, R * 0.02)
      ctx.beginPath()
      ctx.ellipse(0, 0, rx * 0.9, ry * 0.9, tilt, Math.PI * 0.18, Math.PI * 1.08)
      ctx.stroke()
      ctx.restore()
    }

    const drawNebula = (sec: number) => {
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      const blobs = 6
      for (let i = 0; i < blobs; i++) {
        const phase = sec * 0.28 * motion + i * 1.7
        const x = (i % 2 ? 0.25 : 0.1) * w + Math.sin(phase) * w * 0.09 + i * (w / blobs) * 0.35
        const y = h * 0.72 + Math.cos(phase * 0.7) * 28 + (i % 3) * 16
        const r = Math.min(w, h) * (0.18 + (i % 3) * 0.06)
        const g = radial(x, y, r, palette.nebula, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    const drawStars = (sec: number) => {
      ctx.save()
      for (const s of stars) {
        const p = 1 / s.z
        const x = (s.x + Math.sin(sec * 0.06 * motion) * 18 * p + w * 2) % w
        const y = (s.y + Math.cos(sec * 0.05 * motion) * 16 * p + h * 2) % h
        const twinkle = 0.55 + 0.45 * Math.sin(sec * (1.6 + p) * motion + s.tw)
        ctx.globalAlpha = 0.65 * twinkle
        ctx.fillStyle = palette.star
        ctx.beginPath()
        ctx.arc(x, y, s.r * p, 0, Math.PI * 2)
        ctx.fill()

        ctx.globalAlpha = 0.16 * twinkle
        ctx.fillStyle = palette.glow
        ctx.beginPath()
        ctx.arc(x, y, s.r * 4 * p + 0.7, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    const drawNoise = () => {
      if (!noiseTex) return
      ctx.save()
      ctx.globalAlpha = 0.12
      const s = noiseTex.width
      for (let y = 0; y < h; y += s) {
        for (let x = 0; x < w; x += s) {
          ctx.drawImage(noiseTex, x, y)
        }
      }
      ctx.restore()
    }

    // -------- SPACESHIP (single ship, dynamic TTL fix) --------
    type Trail = { x: number; y: number; life: number }
    type Ship = {
      x: number
      y: number
      vx: number
      vy: number
      angle: number
      size: number
      variant: number
      ttl: number
      trail: Trail[]
    }
    let activeShip: Ship | null = null
    let nextSpawnAt = 0 // seconds

    function scheduleNextShip(nowSec: number) {
      nextSpawnAt = nowSec + frand(shipMinDelay, shipMaxDelay)
    }

    function spawnShip() {
      const margin = 100
      const edge = Math.floor(Math.random() * 4) // 0 top, 1 right, 2 bottom, 3 left
      let x = 0,
        y = 0,
        targetX = 0,
        targetY = 0

      if (edge === 0) {
        x = frand(-margin, w + margin)
        y = -margin
        targetX = frand(0, w)
        targetY = h + margin
      } else if (edge === 1) {
        x = w + margin
        y = frand(-margin, h + margin)
        targetX = -margin
        targetY = frand(0, h)
      } else if (edge === 2) {
        x = frand(-margin, w + margin)
        y = h + margin
        targetX = frand(0, w)
        targetY = -margin
      } else {
        x = -margin
        y = frand(-margin, h + margin)
        targetX = w + margin
        targetY = frand(0, h)
      }

      const dx = targetX - x
      const dy = targetY - y
      const angle = Math.atan2(dy, dx)

      // Slower overall speeds; scaled by speedScale
      const baseSpeed = frand(140, 260) * Math.max(0.35, speedScale)
      const vx = Math.cos(angle) * baseSpeed
      const vy = Math.sin(angle) * baseSpeed

      const size = frand(8, 18)
      const variant = Math.random() < 0.5 ? 0 : 1

      // ---- FIX: dynamic TTL based on distance/speed (+ buffer) ----
      const distance = Math.hypot(dx, dy) // px along path to exit
      const bufferSec = 2.0 // safety time after reaching target
      const ttl = Math.min(30, distance / Math.max(60, baseSpeed) + bufferSec)
      // (cap at 30s; also clamp divisor to avoid absurd TTL if baseSpeed is tiny)

      activeShip = { x, y, vx, vy, angle, size, variant, ttl, trail: [] }
    }

    function updateShip(dt: number, nowSec: number) {
      if (!activeShip) {
        if (nowSec >= nextSpawnAt) spawnShip()
        return
      }
      const s = activeShip
      s.x += s.vx * dt
      s.y += s.vy * dt
      s.ttl -= dt

      s.trail.push({ x: s.x, y: s.y, life: 0.5 })
      if (s.trail.length > 60) s.trail.shift()
      for (const p of s.trail) p.life -= dt * 0.9
      s.trail = s.trail.filter((p) => p.life > 0)

      // Despawn when fully past off-screen bounds OR TTL emergency fallback
      if (s.x < -140 || s.x > w + 140 || s.y < -140 || s.y > h + 140 || s.ttl <= 0) {
        activeShip = null
        scheduleNextShip(nowSec)
      }
    }

    function drawShip() {
      if (!activeShip) return
      const s = activeShip

      // trail
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < s.trail.length - 1; i++) {
        const p1 = s.trail[i],
          p2 = s.trail[i + 1]
        ctx.strokeStyle = palette.exhaust
        ctx.globalAlpha = Math.max(0, p1.life) * 0.5
        ctx.lineWidth = Math.max(0.5, s.size * 0.18)
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.stroke()
      }
      ctx.restore()

      // body
      ctx.save()
      ctx.translate(s.x, s.y)
      ctx.rotate(s.angle)
      ctx.fillStyle = palette.ship
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'
      ctx.lineWidth = 0.6

      if (s.variant === 0) {
        // DART
        const L = s.size,
          W = s.size * 0.42,
          F = s.size * 0.25
        ctx.beginPath()
        ctx.moveTo(L, 0)
        ctx.lineTo(-L * 0.6, -W)
        ctx.lineTo(-L * 0.35, -F)
        ctx.lineTo(-L * 0.8, 0)
        ctx.lineTo(-L * 0.35, F)
        ctx.lineTo(-L * 0.6, W)
        ctx.closePath()
        ctx.globalAlpha = 0.95
        ctx.fill()
        ctx.stroke()
      } else {
        // SHUTTLE
        const L = s.size * 0.9,
          W = s.size * 0.5
        ctx.beginPath()
        ctx.moveTo(L, 0)
        ctx.quadraticCurveTo(0, -W, -L, -W * 0.5)
        ctx.lineTo(-L, W * 0.5)
        ctx.quadraticCurveTo(0, W, L, 0)
        ctx.closePath()
        ctx.globalAlpha = 0.95
        ctx.fill()
        ctx.stroke()

        // wings
        ctx.globalAlpha = 0.85
        ctx.beginPath()
        ctx.moveTo(-L * 0.2, -W * 0.9)
        ctx.lineTo(-L * 0.6, -W * 0.3)
        ctx.lineTo(-L * 0.1, -W * 0.3)
        ctx.closePath()
        ctx.fill()
        ctx.beginPath()
        ctx.moveTo(-L * 0.2, W * 0.9)
        ctx.lineTo(-L * 0.6, W * 0.3)
        ctx.lineTo(-L * 0.1, W * 0.3)
        ctx.closePath()
        ctx.fill()
      }

      ctx.restore()
    }
    // -------- end spaceship --------

    const frame = () => {
      frameCount += 1
      const sec = frameCount / 60
      const dt = Math.max(0.001, sec - lastSec)
      lastSec = sec

      drawBackground()
      drawNebula(sec)
      drawPlanetAndStaticRing(sec)
      drawStars(sec)

      updateShip(dt, sec)
      drawShip()

      drawNoise()
      raf = requestAnimationFrame(frame)
    }

    resize()
    window.addEventListener('resize', resize)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [palette, density, motion, shipMinDelay, shipMaxDelay, speedScale, planetTone])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 -z-10 h-full w-full ${className}`}
      style={{
        background: `radial-gradient(1200px 800px at 70% 35%, ${palette.bg3}, transparent 60%),
           linear-gradient(${palette.bg3}, ${palette.bg2} 55%, ${palette.bg1})`,
      }}
      aria-hidden
    />
  )
}
