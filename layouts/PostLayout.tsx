'use client'

import { ReactNode, useEffect, useState } from 'react'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog, Authors } from 'contentlayer/generated'
import Comments from '@/components/Comments'
import Link from '@/components/Link'
import PageTitle from '@/components/PageTitle'
import SectionContainer from '@/components/SectionContainer'
import Image from '@/components/Image'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import ScrollTopAndComment from '@/components/ScrollTopAndComment'

const postDateTemplate: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

interface LayoutProps {
  content: CoreContent<Blog>
  authorDetails: CoreContent<Authors>[]
  next?: { path: string; title: string }
  prev?: { path: string; title: string }
  children: ReactNode
  readingTime?: number // Add reading time from the full post object
}

export default function PostLayout({
  content,
  authorDetails,
  next,
  prev,
  children,
  readingTime,
}: LayoutProps) {
  const { filePath, path, slug, date, title, tags } = content
  const basePath = path.split('/')[0]

  const [isAtTop, setIsAtTop] = useState(true)
  const [fontSize, setFontSize] = useState(100)
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  const SHOW_AUTHOR_SIDEBAR = false // Hidden for now, will be implemented later

  // Detect if screen is large (xl breakpoint = 1280px)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1280px)')

    const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsLargeScreen(e.matches)
    }

    // Set initial value
    handleMediaChange(mediaQuery)

    // Listen for changes
    mediaQuery.addEventListener('change', handleMediaChange)

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      // Check if we're at the very top (or within 5px to account for sub-pixel rendering)
      setIsAtTop(scrollPosition < 5)
    }

    // Set initial state
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Calculate transforms based on scroll position
  // When not at top: hide sidebar and center content
  // When at top: show sidebar and content in original position
  // Only apply animations on large screens (xl breakpoint) where the sidebar layout exists
  const sidebarTranslateX = isLargeScreen && !isAtTop ? -100 : 0 // Move completely off screen when scrolled
  const sidebarOpacity = isLargeScreen && !isAtTop ? 0 : 1 // Fully fade out when scrolled

  // Calculate text centering so the 3/4-width content is centered in a 4-col grid.
  // Translate is relative to the element's width, so we convert the desired container shift (12.5%)
  // into element-relative units: (12.5% / 75%) = 16.6667% of the element width.
  const gridColumns = 4
  const contentSpan = 3
  const contentWidthFraction = contentSpan / gridColumns // 0.75
  const targetCenterShiftFraction = (1 - contentWidthFraction) / 2 // 0.125 of container
  const textTranslateX =
    isLargeScreen && !isAtTop ? -(targetCenterShiftFraction / contentWidthFraction) * 100 : 0

  // Use the reading time from the full post object, format to whole number, fallback to 1 if not provided
  const displayReadingTime = readingTime ? Math.ceil(readingTime) : 1

  return (
    <SectionContainer>
      <ScrollTopAndComment fontSize={fontSize} onFontSizeChange={setFontSize} />
      <article>
        <div className="xl:divide-y xl:divide-gray-200 xl:dark:divide-gray-700">
          <header className="pt-6 xl:pb-6">
            <div className="space-y-1 text-center">
              <dl className="space-y-10">
                <div>
                  <dt className="sr-only">Published on</dt>
                  <dd className="text-base leading-6 font-medium text-gray-500 dark:text-gray-400">
                    <time dateTime={date}>
                      {new Date(date).toLocaleDateString(siteMetadata.locale, postDateTemplate)}
                    </time>
                  </dd>
                </div>
              </dl>
              <div>
                <PageTitle>{title}</PageTitle>
              </div>
              <div className="pt-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {displayReadingTime} min read
                </span>
              </div>
            </div>
          </header>
          <div className="relative grid-rows-[auto_1fr] divide-y divide-gray-200 overflow-hidden pb-8 xl:grid xl:grid-cols-4 xl:gap-x-6 xl:divide-y-0 dark:divide-gray-700">
            {/* Sidebar - Author Section */}
            {SHOW_AUTHOR_SIDEBAR && (
              <dl
                className="pt-6 pb-10 xl:border-b xl:border-gray-200 xl:pt-11 xl:dark:border-gray-700"
                style={{
                  transform: `translateX(${sidebarTranslateX}%)`,
                  opacity: sidebarOpacity,
                  transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out',
                }}
              >
                <dt className="sr-only">Authors</dt>
                <dd>
                  <ul className="flex flex-wrap justify-center gap-4 sm:space-x-12 xl:block xl:space-y-8 xl:space-x-0">
                    {authorDetails.map((author) => (
                      <li className="flex items-center space-x-2" key={author.name}>
                        {author.avatar && (
                          <Image
                            src={author.avatar}
                            width={38}
                            height={38}
                            alt="avatar"
                            className="h-10 w-10 rounded-full"
                          />
                        )}
                        <dl className="text-sm leading-5 font-medium whitespace-nowrap">
                          <dt className="sr-only">Name</dt>
                          <dd className="text-gray-900 dark:text-gray-100">{author.name}</dd>
                          <dt className="sr-only">Twitter</dt>
                          <dd>
                            {author.twitter && (
                              <Link
                                href={author.twitter}
                                className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                              >
                                {author.twitter
                                  .replace('https://twitter.com/', '@')
                                  .replace('https://x.com/', '@')}
                              </Link>
                            )}
                          </dd>
                        </dl>
                      </li>
                    ))}
                  </ul>
                </dd>
              </dl>
            )}

            {/* Main Content Area - Fixed Grid Position */}
            <div className="divide-y divide-gray-200 xl:col-span-3 xl:row-span-2 xl:pb-0 dark:divide-gray-700">
              <div
                className="prose dark:prose-invert max-w-none pt-10 pb-8"
                style={{
                  transform: `translateX(${textTranslateX}%)`,
                  transition: 'transform 0.5s ease-in-out',
                  fontSize: `${fontSize}%`,
                }}
              >
                {children}
              </div>
              {/* will implement later*/}
              {/* {siteMetadata.comments && (
                <div
                  className="pt-6 pb-6 text-center text-gray-700 dark:text-gray-300"
                  style={{
                    transform: `translateX(${textTranslateX}%)`,
                    transition: 'none'
                  }}
                  id="comment"
                >
                  <Comments slug={slug} />
                </div>
              )} */}
            </div>

            {/* Sidebar Footer - Tags and Navigation */}
            <footer
              className="xl:col-start-1 xl:row-start-2"
              style={{
                transform: `translateX(${sidebarTranslateX}%)`,
                opacity: sidebarOpacity,
                transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out',
              }}
            >
              <div className="divide-gray-200 text-sm leading-5 font-medium xl:col-start-1 xl:row-start-2 xl:divide-y dark:divide-gray-700">
                {tags && (
                  <div className="py-4 xl:py-8">
                    <h2 className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                      Tags
                    </h2>
                    <div className="flex flex-wrap">
                      {tags.map((tag) => (
                        <Tag key={tag} text={tag} />
                      ))}
                    </div>
                  </div>
                )}
                {(next || prev) && (
                  <div className="flex justify-between py-4 xl:block xl:space-y-8 xl:py-8">
                    {prev && prev.path && (
                      <div>
                        <h2 className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                          Previous Article
                        </h2>
                        <div className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400">
                          <Link href={`/${prev.path}`}>{prev.title}</Link>
                        </div>
                      </div>
                    )}
                    {next && next.path && (
                      <div>
                        <h2 className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                          Next Article
                        </h2>
                        <div className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400">
                          <Link href={`/${next.path}`}>{next.title}</Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="pt-4 xl:pt-8">
                <Link
                  href={`/${basePath}`}
                  className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                  aria-label="Back to stories"
                >
                  &larr; Back to stories
                </Link>
              </div>
            </footer>
          </div>
        </div>
      </article>
    </SectionContainer>
  )
}
