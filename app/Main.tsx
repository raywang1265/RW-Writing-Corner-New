'use client'

import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from 'pliny/utils/formatDate'
import NewsletterForm from '@/components/NewsletterForm'
import { useEffect, useState } from 'react'

const MAX_DISPLAY = 5

// Array of welcome messages
const welcomeMessages = [
  'Welcome👋',
  'Hello there👋',
  'Glad you’re here👋',
  'Step right in👋',
]

// QWERTY keyboard layout with coordinates (row, column)
const keyboardLayout = {
  q: [0, 0], w: [0, 1], e: [0, 2], r: [0, 3], t: [0, 4], y: [0, 5], u: [0, 6], i: [0, 7], o: [0, 8], p: [0, 9],
  a: [1, 0.5], s: [1, 1.5], d: [1, 2.5], f: [1, 3.5], g: [1, 4.5], h: [1, 5.5], j: [1, 6.5], k: [1, 7.5], l: [1, 8.5],
  z: [2, 1], x: [2, 2], c: [2, 3], v: [2, 4], b: [2, 5], n: [2, 6], m: [2, 7],
  ' ': [3, 3.5], // Space bar in the middle of bottom row
  '!': [0, 10], // Exclamation mark (shift+1, approximate position)
  '👋': [3, 3.5], // Wave emoji - same position as space
}

// Calculate distance between two keys on keyboard
const getKeyDistance = (char1: string, char2: string): number => {
  // Check for the character as-is first (for space, punctuation), then lowercase
  const key1 = keyboardLayout[char1] || keyboardLayout[char1.toLowerCase()]
  const key2 = keyboardLayout[char2] || keyboardLayout[char2.toLowerCase()]
  
  if (!key1 || !key2) return 3 // Default distance for special chars
  
  const rowDiff = Math.abs(key1[0] - key2[0])
  const colDiff = Math.abs(key1[1] - key2[1])
  
  return Math.sqrt(rowDiff * rowDiff + colDiff * colDiff)
}

// Map distance to typing delay (closer keys = faster typing)
const getTypingDelay = (distance: number): number => {
  // Base delay: 80ms for adjacent keys, up to 180ms for far keys
  const baseDelay = 80
  const maxDelay = 180
  const delayRange = maxDelay - baseDelay
  
  // Normalize distance (most keys are within 0-8 distance range)
  const normalizedDistance = Math.min(distance / 8, 1)
  
  // Add some randomness for human feel (±20ms)
  const randomness = (Math.random() - 0.5) * 40
  
  return baseDelay + (delayRange * normalizedDistance) + randomness
}

export default function Home({ posts }) {
  const [scrollY, setScrollY] = useState(0)
  const [typedText, setTypedText] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  const [fullText, setFullText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)

  useEffect(() => {
    // Select welcome message only on client-side to avoid SSR/hydration mismatch
    setFullText(welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)])
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Realistic typing animation effect based on keyboard distances
  useEffect(() => {
    if (!isMounted || !fullText) return // Don't start typing until component is mounted and text is set
    
    // Get text without emoji
    const textWithoutEmoji = fullText.replace('👋', '')
    
    if (typedText.length < textWithoutEmoji.length) {
      const currentChar = textWithoutEmoji[typedText.length]
      const prevChar = typedText.length > 0 ? textWithoutEmoji[typedText.length - 1] : ''
      
      // Calculate delay based on keyboard distance
      const distance = prevChar ? getKeyDistance(prevChar, currentChar) : 0
      const delay = prevChar ? getTypingDelay(distance) : 2000 // Initial delay before first char (cursor blinks for ~1.2 seconds)
      
      const timeout = setTimeout(() => {
        setTypedText(textWithoutEmoji.slice(0, typedText.length + 1))
      }, delay)
      
      return () => clearTimeout(timeout)
    } else if (typedText.length === textWithoutEmoji.length && fullText.includes('👋')) {
      // Show emoji after a brief delay once text is complete
      const timeout = setTimeout(() => {
        setShowEmoji(true)
      }, 150)
      return () => clearTimeout(timeout)
    }
  }, [typedText, isMounted, fullText, showEmoji])

  // Calculate opacity based on scroll position
  // Starts at 0 (fully transparent) and reaches 0.85 (nearly opaque) at 800px scroll
  const backgroundOpacity = Math.min(scrollY / 700, 3)

  return (
    <>
      {/* Scroll-based blur overlay for main page only */}
      <div 
        className="fixed inset-0 z-5 pointer-events-none"
        style={{
          backdropFilter: `blur(${backgroundOpacity * 12}px)`,
          WebkitBackdropFilter: `blur(${backgroundOpacity * 12}px)`,
        }}
      />
      <div className="relative z-10 divide-y divide-gray-200/30 dark:divide-gray-700/30 p-6">
        <div className="space-y-8 pt-8 pb-6 md:space-y-10">
          <div className="space-y-6">
            <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-gray-900 sm:text-5xl sm:leading-tight md:text-7xl md:leading-tight dark:text-gray-100">
              {isMounted && (
                <>
                  {typedText}
                  {showEmoji && '👋'}
                  <span 
                    className="inline-block w-4 h-1 ml-1 bg-gray-900 dark:bg-gray-100 align-baseline sm:w-5 sm:h-1.5 md:w-7 md:h-2"
                    style={{
                      animation: 'cursor-blink 1s step-end infinite',
                    }}
                  />
                </>
              )}
            </h1>
            <p className="text-xl leading-8 text-gray-900 dark:text-gray-300 max-w-[700px]">
            You've arrived at my hub for all things writing, with a side of tech and personal projects. If you'd like to delve into some fiction, head over to the stories tab or scroll down to see the latest stories. 
            <br></br>
            <br></br>
            If you're interested in finding more about me (perhaps in the context of recruitment), check out the about tab and feel free to read{' '}
            <Link 
              href="/stories/my-story-with-tech"
              className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 underline"
            >
              this article on my history with tech
            </Link>!
            <br></br>
            <br></br>
            Thanks for stopping by and happy reading :)
            </p>
          </div>
          <div className="space-y-4 mt-40">
            <h1 className="text-3xl leading-8 font-bold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 dark:text-gray-100">
              Latest
            </h1>
          </div>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {!posts.length && 'No posts found.'}
          {posts.slice(0, MAX_DISPLAY).map((post) => {
            const { slug, date, title, summary, tags, readingTime } = post
            return (
              <li key={slug} className="py-12">
                <article>
                  <div className="space-y-2 xl:grid xl:grid-cols-4 xl:items-baseline xl:space-y-0">
                    <dl>
                      <dt className="sr-only">Published on</dt>
                      <dd className="text-base leading-6 font-medium text-gray-700 dark:text-gray-400">
                        <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
                      </dd>
                      {readingTime && (
                        <dd className="text-sm text-gray-700 dark:text-gray-400">
                          {Math.ceil(readingTime.minutes)} min read
                        </dd>
                      )}
                    </dl>
                    <div className="space-y-5 xl:col-span-3">
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-2xl leading-8 font-bold tracking-tight">
                            <Link
                              href={`/stories/${slug}`}
                              className="text-gray-900 dark:text-gray-100"
                            >
                              {title}
                            </Link>
                          </h2>
                          <div className="flex flex-wrap">
                            {tags.map((tag) => (
                              <Tag key={tag} text={tag} />
                            ))}
                          </div>
                        </div>
                        <div className="prose max-w-none text-gray-700 dark:text-gray-400">
                          {summary}
                        </div>
                      </div>
                      <div className="text-base leading-6 font-medium">
                        <Link
                          href={`/stories/${slug}`}
                          className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                          aria-label={`Read more: "${title}"`}
                        >
                          Read more &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      </div>
      {posts.length > MAX_DISPLAY && (
        <div className="flex justify-end text-base leading-6 font-medium mt-6 relative z-10">
          <Link
            href="/stories"
            className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
            aria-label="All posts"
          >
            All Posts &rarr;
          </Link>
        </div>
      )}
      {siteMetadata.newsletter?.provider && (
        <div id="newsletter" className="flex items-center justify-center pt-4 relative z-10">
          <NewsletterForm />
        </div>
      )}
    </>
  )
}
