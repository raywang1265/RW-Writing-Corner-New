'use client'

import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from 'pliny/utils/formatDate'
import NewsletterForm from '@/components/NewsletterForm'
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
        <div className="space-y-8 pt-8 pb-12 md:space-y-10">
          <div className="space-y-6">
            <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-gray-900 sm:text-5xl sm:leading-tight md:text-7xl md:leading-tight dark:text-gray-100">
              Welcome
            </h1>
            <p className="text-xl leading-8 text-gray-600 dark:text-gray-300 max-w-4xl">
            You've arrived at my hub for all things writing, with a side of tech and personal projects. If you'd like to delve into some fiction, head over to the stories tab or scroll down to see the latest stories. If you're interested in finding more about me (perhaps in the context of recruitment), check out the about tab and feel free to read{' '}
            <Link 
              href="/stories/my-story-with-tech"
              className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 underline"
            >
              this article on my history with tech
            </Link>!
            <br></br>
            <br></br>
            On a side note, this website also displays a randomized theme and welcome message to keep things fresh on every visit! However, if you find there’s a particular theme you enjoy the most, you can choose one from the available set in the theme picker :)
            </p>
          </div>
          <div className="space-y-4 mt-12">
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
                      <dd className="text-base leading-6 font-medium text-gray-500 dark:text-gray-400">
                        <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
                      </dd>
                      {readingTime && (
                        <dd className="text-sm text-gray-500 dark:text-gray-400">
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
                        <div className="prose max-w-none text-gray-500 dark:text-gray-400">
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
