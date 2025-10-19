'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from '@/components/Link'
import GlobalBackground from '@/components/GlobalBackground'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  // Prevent scrolling on this page
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  useEffect(() => {
    const unsubscribe = async () => {
      if (!email) {
        setStatus('error')
        setMessage('Invalid email address.')
        return
      }

      try {
        const response = await fetch('/api/newsletter/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        })

        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage(data.message || 'Successfully unsubscribed.')
        } else {
          setStatus('error')
          setMessage(data.error || 'Failed to unsubscribe. Please try again.')
        }
      } catch (error) {
        setStatus('error')
        setMessage('An error occurred. Please try again.')
      }
    }

    unsubscribe()
  }, [email])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <GlobalBackground />
      <div className="relative z-10 w-full max-w-md rounded-lg bg-gray-100/40 p-8 text-center backdrop-blur-md dark:bg-gray-800/40">
        {status === 'loading' && (
          <>
            <div className="border-t-primary-500 mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 dark:border-gray-600"></div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Unsubscribing...
            </h1>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-4 text-6xl">✓</div>
            <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
              Successfully Unsubscribed
            </h1>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-500">
              You will no longer receive newsletter emails.
            </p>
            <Link
              href="/"
              className="bg-primary-500 hover:bg-primary-600 focus:ring-primary-500 inline-block rounded-md px-6 py-3 font-medium text-white focus:ring-2 focus:ring-offset-2 focus:outline-none dark:ring-offset-gray-900"
            >
              Return to Homepage
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-4 text-6xl">✗</div>
            <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
              Unsubscribe Failed
            </h1>
            <p className="mb-6 text-gray-600 dark:text-gray-400">{message}</p>
            <Link
              href="/"
              className="bg-primary-500 hover:bg-primary-600 focus:ring-primary-500 inline-block rounded-md px-6 py-3 font-medium text-white focus:ring-2 focus:ring-offset-2 focus:outline-none dark:ring-offset-gray-900"
            >
              Return to Homepage
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <GlobalBackground />
          <div className="relative z-10 w-full max-w-md rounded-lg bg-gray-100/40 p-8 text-center backdrop-blur-md dark:bg-gray-800/40">
            <div className="border-t-primary-500 mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 dark:border-gray-600"></div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Loading...</h1>
          </div>
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  )
}
