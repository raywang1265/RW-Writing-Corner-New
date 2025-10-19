import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
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

    const supabase = createAdminClient()

    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from('newsletter_subscribers')
      .select('email, subscribed')
      .eq('email', email.toLowerCase())
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is okay
      console.error('Error checking subscriber:', checkError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (existing) {
      if (existing.subscribed) {
        return NextResponse.json({ message: 'You are already subscribed!' }, { status: 200 })
      } else {
        // Resubscribe
        const { error: updateError } = await supabase
          .from('newsletter_subscribers')
          .update({ subscribed: true, updated_at: new Date().toISOString() })
          .eq('email', email.toLowerCase())

        if (updateError) {
          console.error('Error resubscribing:', updateError)
          return NextResponse.json({ error: 'Failed to resubscribe' }, { status: 500 })
        }

        // Send welcome email (don't block on it)
        sendWelcomeEmail(email.toLowerCase()).catch((err) => {
          console.error('Failed to send welcome email:', err)
        })

        return NextResponse.json({ message: 'Successfully resubscribed!' }, { status: 200 })
      }
    }

    // Add new subscriber
    const { error: insertError } = await supabase.from('newsletter_subscribers').insert([
      {
        email: email.toLowerCase(),
        subscribed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])

    if (insertError) {
      console.error('Error inserting subscriber:', insertError)
      // Check if it's a duplicate key error (email already exists)
      if (insertError.code === '23505') {
        return NextResponse.json({ message: "You're already subscribed!" }, { status: 200 })
      }
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
    }

    // Send welcome email (don't block on it)
    sendWelcomeEmail(email.toLowerCase()).catch((err) => {
      console.error('Failed to send welcome email:', err)
    })

    return NextResponse.json({ message: 'Successfully subscribed!' }, { status: 201 })
  } catch (error) {
    console.error('Subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
