'use client'

import { useEffect, useRef } from 'react'

export default function NebulaBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Animation variables
    let animationId: number
    let time = 0
    let speed = 0.3 // Much slower, realistic travel speed

    // Realistic star colors - mostly white with subtle variations
    const starColors = [
      { r: 255, g: 255, b: 255 }, // Pure white
      { r: 240, g: 240, b: 255 }, // Slightly blue-white
      { r: 255, g: 250, b: 240 }, // Slightly warm white
      { r: 220, g: 220, b: 255 }, // Cool white
      { r: 255, g: 240, b: 240 }, // Slightly red-white
    ]

    // Create distant starfield
    const stars: Array<{
      x: number
      y: number
      z: number
      size: number
      color: { r: number; g: number; b: number }
      brightness: number
      twinklePhase: number
      trail: Array<{ x: number; y: number; z: number; opacity: number }>
    }> = []

    // Create asteroids
    const asteroids: Array<{
      x: number
      y: number
      z: number
      vx: number
      vy: number
      vz: number
      size: number
      rotation: number
      rotationSpeed: number
      shape: number[] // For irregular asteroid shape
      trail: Array<{ x: number; y: number; z: number; opacity: number }>
    }> = []

    // Initialize starfield with more distant stars
    const initStars = () => {
      for (let i = 0; i < 300; i++) {
        stars.push({
          x: Math.random() * canvas.width * 2 - canvas.width / 2, // Spread beyond screen edges
          y: Math.random() * canvas.height * 2 - canvas.height / 2, // Spread beyond screen edges
          z: Math.random() * 2000 + 500, // Much more distant
          size: Math.random() * 1.5 + 0.3, // Smaller, more realistic
          color: starColors[Math.floor(Math.random() * starColors.length)],
          brightness: Math.random() * 0.6 + 0.1, // Dimmer, more realistic
          twinklePhase: 0, // No twinkling
          trail: [], // Initialize empty trail
        })
      }
    }

    // Initialize asteroids
    const initAsteroids = () => {
      for (let i = 0; i < 5; i++) {
        // Create irregular asteroid shape
        const shape: number[] = []
        for (let j = 0; j < 8; j++) {
          shape.push(Math.random() * 0.4 + 0.8) // Random radius variations
        }

        asteroids.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: Math.random() * 800 + 200,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          vz: -speed * 2 - Math.random() * 0.5,
          size: Math.random() * 8 + 4,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
          shape: shape,
          trail: [], // Initialize empty trail
        })
      }
    }

    initStars()
    initAsteroids()

    // Trail management functions
    const addTrailPoint = (
      trail: Array<{ x: number; y: number; z: number; opacity: number }>,
      x: number,
      y: number,
      z: number
    ) => {
      trail.push({ x, y, z, opacity: 1.0 })
      // Limit trail length
      if (trail.length > 20) {
        trail.shift()
      }
    }

    const updateTrail = (trail: Array<{ x: number; y: number; z: number; opacity: number }>) => {
      // Fade out trail points
      trail.forEach((point) => {
        point.opacity -= 0.05
      })
      // Remove faded points
      return trail.filter((point) => point.opacity > 0)
    }

    const drawTrail = (
      trail: Array<{ x: number; y: number; z: number; opacity: number }>,
      color: { r: number; g: number; b: number },
      size: number
    ) => {
      if (trail.length < 2) return

      for (let i = 0; i < trail.length - 1; i++) {
        const point1 = trail[i]
        const point2 = trail[i + 1]

        // Calculate 2D positions
        const x1 = (point1.x - canvas.width / 2) * (300 / point1.z) + canvas.width / 2
        const y1 = (point1.y - canvas.height / 2) * (300 / point1.z) + canvas.height / 2
        const x2 = (point2.x - canvas.width / 2) * (300 / point2.z) + canvas.width / 2
        const y2 = (point2.y - canvas.height / 2) * (300 / point2.z) + canvas.height / 2

        // Only draw if both points are on screen
        if (
          (x1 >= -50 && x1 <= canvas.width + 50 && y1 >= -50 && y1 <= canvas.height + 50) ||
          (x2 >= -50 && x2 <= canvas.width + 50 && y2 >= -50 && y2 <= canvas.height + 50)
        ) {
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${point1.opacity * 0.3})`
          ctx.lineWidth = Math.max(0.5, size * 0.1)
          ctx.stroke()
        }
      }
    }

    // Animation loop
    const animate = () => {
      time += 0.005 // Much slower time progression

      // Clear canvas with subtle fade
      ctx.fillStyle = 'rgba(0, 0, 0, 0.02)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw distant starfield
      stars.forEach((star) => {
        // Add current position to trail
        addTrailPoint(star.trail, star.x, star.y, star.z)

        // Update trail (fade and remove old points)
        star.trail = updateTrail(star.trail)

        // Very slow movement towards viewer
        star.z -= speed * 0.5

        // Reset star when it gets too close
        if (star.z <= 100) {
          star.x = Math.random() * canvas.width * 2 - canvas.width / 2
          star.y = Math.random() * canvas.height * 2 - canvas.height / 2
          star.z = 2000 + Math.random() * 1000
          star.color = starColors[Math.floor(Math.random() * starColors.length)]
          star.trail = [] // Clear trail when star resets
        }

        // Calculate 2D position from 3D
        const x = (star.x - canvas.width / 2) * (300 / star.z) + canvas.width / 2
        const y = (star.y - canvas.height / 2) * (300 / star.z) + canvas.height / 2
        const size = star.size * (300 / star.z)

        // Draw trail first (behind the star)
        drawTrail(star.trail, star.color, size)

        // Only draw star if on screen and visible
        if (
          x >= -10 &&
          x <= canvas.width + 10 &&
          y >= -10 &&
          y <= canvas.height + 10 &&
          size > 0.1
        ) {
          // Static stars with no twinkling or streaking
          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${star.brightness})`
          ctx.fill()
        }
      })

      // Draw asteroids
      asteroids.forEach((asteroid) => {
        // Add current position to trail
        addTrailPoint(asteroid.trail, asteroid.x, asteroid.y, asteroid.z)

        // Update trail (fade and remove old points)
        asteroid.trail = updateTrail(asteroid.trail)

        // Update position
        asteroid.x += asteroid.vx
        asteroid.y += asteroid.vy
        asteroid.z += asteroid.vz
        asteroid.rotation += asteroid.rotationSpeed

        // Reset asteroid when it goes off screen or gets too close
        if (
          asteroid.z <= 50 ||
          asteroid.x < -100 ||
          asteroid.x > canvas.width + 100 ||
          asteroid.y < -100 ||
          asteroid.y > canvas.height + 100
        ) {
          asteroid.x = Math.random() * canvas.width
          asteroid.y = Math.random() * canvas.height
          asteroid.z = 800 + Math.random() * 400
          asteroid.vx = (Math.random() - 0.5) * 0.5
          asteroid.vy = (Math.random() - 0.5) * 0.5
          asteroid.trail = [] // Clear trail when asteroid resets
        }

        // Calculate 2D position from 3D
        const x = (asteroid.x - canvas.width / 2) * (200 / asteroid.z) + canvas.width / 2
        const y = (asteroid.y - canvas.height / 2) * (200 / asteroid.z) + canvas.height / 2
        const size = asteroid.size * (200 / asteroid.z)

        // Draw trail first (behind the asteroid)
        drawTrail(asteroid.trail, { r: 80, g: 80, b: 80 }, size)

        // Only draw if on screen and visible
        if (x >= -50 && x <= canvas.width + 50 && y >= -50 && y <= canvas.height + 50 && size > 1) {
          // Draw irregular asteroid shape
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(asteroid.rotation)

          ctx.beginPath()
          for (let i = 0; i < asteroid.shape.length; i++) {
            const angle = (i / asteroid.shape.length) * Math.PI * 2
            const radius = size * asteroid.shape[i]
            const px = Math.cos(angle) * radius
            const py = Math.sin(angle) * radius

            if (i === 0) {
              ctx.moveTo(px, py)
            } else {
              ctx.lineTo(px, py)
            }
          }
          ctx.closePath()

          // Dark gray asteroid color
          ctx.fillStyle = `rgba(80, 80, 80, ${Math.max(0, 1 - asteroid.z / 1000)})`
          ctx.fill()

          // Add subtle highlight
          ctx.strokeStyle = `rgba(120, 120, 120, ${Math.max(0, 0.3 - asteroid.z / 2000)})`
          ctx.lineWidth = 1
          ctx.stroke()

          ctx.restore()
        }
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 h-full w-full"
      style={{
        background: 'radial-gradient(ellipse at center, #000011 0%, #000008 50%, #000000 100%)',
      }}
    />
  )
}
