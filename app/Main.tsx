'use client'

import Link from '@/components/Link'
import Tag from '@/components/Tag'
import NebulaBackground from '@/components/NebulaBackground'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from 'pliny/utils/formatDate'
import NewsletterForm from 'pliny/ui/NewsletterForm'
import { useEffect, useState } from 'react'

const MAX_DISPLAY = 5

export default function Home({ posts }) {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Calculate opacity based on scroll position
  // Starts at 0 (fully transparent) and reaches 0.85 (nearly opaque) at 800px scroll
  const backgroundOpacity = Math.min(scrollY / 800, 0.85)

  return (
    <>
      <NebulaBackground />
      {/* Scroll-based blur overlay */}
      <div 
        className="fixed inset-0 z-5 pointer-events-none"
        style={{
          backdropFilter: `blur(${backgroundOpacity * 12}px)`,
          WebkitBackdropFilter: `blur(${backgroundOpacity * 12}px)`,
        }}
      />
      <div className="relative z-10 divide-y divide-gray-200/30 dark:divide-gray-700/30 p-6">
        <div className="space-y-8 pt-8 pb-12 md:space-y-10">
          <div className="space-y-6">
            <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-gray-900 sm:text-5xl sm:leading-tight md:text-7xl md:leading-tight dark:text-gray-100">
              Welcome
            </h1>
            <p className="text-xl leading-8 text-gray-600 dark:text-gray-300 max-w-4xl">
              A space where thoughts transform into words, ideas take flight, and stories come alive. 
              Join me on this journey through the art of writing, creativity, and the endless possibilities of language. 
              Here you'll find insights on storytelling, practical writing tips, and inspiration to fuel your creative journey. 
              Whether you're a seasoned writer or just beginning to explore the world of words, this corner of the internet 
              is designed to inspire, educate, and connect fellow lovers of the written word.
            </p>
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl leading-8 font-bold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 dark:text-gray-100">
              Latest
            </h1>
          </div>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {!posts.length && 'No posts found.'}
          {posts.slice(0, MAX_DISPLAY).map((post) => {
            const { slug, date, title, summary, tags } = post
            return (
              <li key={slug} className="py-12">
                <article>
                  <div className="space-y-2 xl:grid xl:grid-cols-4 xl:items-baseline xl:space-y-0">
                    <dl>
                      <dt className="sr-only">Published on</dt>
                      <dd className="text-base leading-6 font-medium text-gray-500 dark:text-gray-400">
                        <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
                      </dd>
                    </dl>
                    <div className="space-y-5 xl:col-span-3">
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-2xl leading-8 font-bold tracking-tight">
                            <Link
                              href={`/blog/${slug}`}
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
                        <div className="prose max-w-none text-gray-500 dark:text-gray-400">
                          {summary}
                        </div>
                      </div>
                      <div className="text-base leading-6 font-medium">
                        <Link
                          href={`/blog/${slug}`}
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
            href="/blog"
            className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
            aria-label="All posts"
          >
            All Posts &rarr;
          </Link>
        </div>
      )}
      {siteMetadata.newsletter?.provider && (
        <div className="flex items-center justify-center pt-4 relative z-10">
          <NewsletterForm />
        </div>
      )}
    </>
  )
}
