import { NextRequest, NextResponse, after } from 'next/server'
import { getFirestore, admin } from '@/lib/firebase'
import { Resend } from 'resend'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY)

// Email configuration
const FROM_EMAIL = process.env.NEWSLETTER_FROM_EMAIL || 'newsletter@yourdomain.com'
const FROM_NAME = process.env.NEWSLETTER_FROM_NAME || 'RW Writing Corner'
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://tailwind-nextjs-starter-blog.vercel.app'

async function sendWelcomeEmail(email: string) {
  try {
    console.log('[Welcome Email] Starting to send welcome email to:', email)
    console.log('[Welcome Email] Environment check:', {
      hasResendKey: !!process.env.RESEND_API_KEY,
      fromEmail: FROM_EMAIL,
      fromName: FROM_NAME,
      siteUrl: SITE_URL,
    })

    // Read the welcome email template
    const templatePath = resolve(process.cwd(), 'newsletter-templates', 'welcome.html')
    console.log('[Welcome Email] Template path:', templatePath)

    let htmlContent = readFileSync(templatePath, 'utf-8')
    console.log('[Welcome Email] Template loaded successfully')

    // Replace placeholders
    htmlContent = htmlContent.replace(/{{SITE_URL}}/g, SITE_URL)
    htmlContent = htmlContent.replace(/{{EMAIL}}/g, encodeURIComponent(email))

    // Plain text version (important for spam filters)
    const textContent = `
RW Writing Corner

Thanks for subscribing

You'll receive updates when I publish new stories, including science fiction, fantasy, personal reflections, and tech writing.

You can look forward to: New story notifications and occasional updates about my writing. No spam, unsubscribe anytime.

Read Stories: ${SITE_URL}/stories

Happy reading!
Ray

---
© 2025 RW Writing Corner. All rights reserved.
Unsubscribe: ${SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}
    `.trim()

    console.log('[Welcome Email] Sending email via Resend...')

    // Send the email with both HTML and plain text versions
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: `Welcome to ${FROM_NAME}`,
      html: htmlContent,
      text: textContent,
    })

    if (error) {
      console.error('[Welcome Email] Error sending welcome email:', error)
      return { success: false, error }
    }

    console.log('[Welcome Email] Email sent successfully! ID:', data?.id)
    return { success: true, data }
  } catch (error) {
    console.error('[Welcome Email] Exception in sendWelcomeEmail:', error)
    return { success: false, error }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const db = getFirestore()
    const normalizedEmail = email.toLowerCase()
    const subscriberRef = db.collection('newsletter_subscribers').doc(normalizedEmail)

    // Check if email already exists
    const doc = await subscriberRef.get()

    if (doc.exists) {
      const data = doc.data()
      if (data?.subscribed) {
        return NextResponse.json({ message: 'You are already subscribed!' }, { status: 200 })
      } else {
        // Resubscribe
        try {
          await subscriberRef.update({
            subscribed: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          })

          // Keep the function alive after the response so Resend isn't cut off on Vercel
          after(async () => {
            try {
              await sendWelcomeEmail(normalizedEmail)
            } catch (err) {
              console.error('Failed to send welcome email:', err)
            }
          })

          return NextResponse.json({ message: 'Successfully resubscribed!' }, { status: 200 })
        } catch (updateError) {
          console.error('Error resubscribing:', updateError)
          return NextResponse.json({ error: 'Failed to resubscribe' }, { status: 500 })
        }
      }
    }

    // Add new subscriber
    try {
      await subscriberRef.set({
        email: normalizedEmail,
        subscribed: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      // Keep the function alive after the response so Resend isn't cut off on Vercel
      after(async () => {
        try {
          await sendWelcomeEmail(normalizedEmail)
        } catch (err) {
          console.error('Failed to send welcome email:', err)
        }
      })

      return NextResponse.json({ message: 'Successfully subscribed!' }, { status: 201 })
    } catch (insertError) {
      console.error('Error inserting subscriber:', insertError)
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
    }
  } catch (error) {
    console.error('Subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
