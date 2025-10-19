#!/usr/bin/env node

/**
 * Newsletter Sending Script
 *
 * This script sends a newsletter to all subscribed users.
 *
 * Usage:
 *   node scripts/send-newsletter.mjs --subject "Your Subject" --content "path/to/content.html"
 *
 * Or for a test run:
 *   node scripts/send-newsletter.mjs --test --subject "Test" --content "path/to/content.html"
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: '.env.local' })

// Parse command line arguments
const args = process.argv.slice(2)
const isTest = args.includes('--test')
const subjectIndex = args.indexOf('--subject')
const contentIndex = args.indexOf('--content')
const htmlIndex = args.indexOf('--html')

if (subjectIndex === -1 || (contentIndex === -1 && htmlIndex === -1)) {
  console.error(
    'Usage: node send-newsletter.mjs --subject "Your Subject" [--content path/to/file.html | --html "<p>HTML content</p>"] [--test]'
  )
  process.exit(1)
}

const subject = args[subjectIndex + 1]
let htmlContent

if (htmlIndex !== -1) {
  htmlContent = args[htmlIndex + 1]
} else {
  const contentPath = args[contentIndex + 1]
  try {
    htmlContent = readFileSync(resolve(contentPath), 'utf-8')
  } catch (error) {
    console.error('Error reading content file:', error.message)
    process.exit(1)
  }
}

// Initialize clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const resendApiKey = process.env.RESEND_API_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

if (!resendApiKey) {
  console.error('Missing RESEND_API_KEY environment variable')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const resend = new Resend(resendApiKey)

// Email configuration
const FROM_EMAIL = process.env.NEWSLETTER_FROM_EMAIL || 'newsletter@yourdomain.com'
const FROM_NAME = process.env.NEWSLETTER_FROM_NAME || 'RW Writing Corner'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoursite.com'

async function getSubscribers() {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('email')
    .eq('subscribed', true)

  if (error) {
    throw new Error(`Failed to fetch subscribers: ${error.message}`)
  }

  return data.map((sub) => sub.email)
}

function createEmailHTML(content, email) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 20px 0; font-size: 28px; font-weight: 600; color: #1a1a1a;">${FROM_NAME}</h1>
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; border-top: 1px solid #e5e5e5; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
                You're receiving this because you subscribed to ${FROM_NAME}.
              </p>
              <p style="margin: 0; font-size: 14px; color: #666;">
                <a href="${SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}" style="color: #0066cc; text-decoration: none;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

async function sendEmail(email, subject, html) {
  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: subject,
      html: html,
    })

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function sendNewsletter() {
  console.log('🚀 Starting newsletter send...')
  console.log(`📧 Subject: ${subject}`)
  console.log(`🧪 Test mode: ${isTest ? 'YES' : 'NO'}`)
  console.log('')

  try {
    // Get all subscribers
    const subscribers = await getSubscribers()
    console.log(`📊 Found ${subscribers.length} active subscriber(s)`)

    if (subscribers.length === 0) {
      console.log('⚠️  No active subscribers found')
      return
    }

    // In test mode, only send to first subscriber
    const emailsToSend = isTest ? subscribers.slice(0, 1) : subscribers

    if (isTest) {
      console.log(`🧪 Test mode: Sending only to ${emailsToSend[0]}`)
      console.log('')
    }

    let successCount = 0
    let failCount = 0

    // Send emails with rate limiting (to respect Resend's limits)
    for (let i = 0; i < emailsToSend.length; i++) {
      const email = emailsToSend[i]
      const emailHTML = createEmailHTML(htmlContent, email)

      const result = await sendEmail(email, subject, emailHTML)

      if (result.success) {
        successCount++
        console.log(`✅ Sent to ${email}`)
      } else {
        failCount++
        console.error(`❌ Failed to send to ${email}: ${result.error}`)
      }

      // Rate limiting: wait 100ms between emails
      if (i < emailsToSend.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    console.log('')
    console.log('📈 Newsletter Send Complete!')
    console.log(`✅ Successful: ${successCount}`)
    console.log(`❌ Failed: ${failCount}`)
  } catch (error) {
    console.error('❌ Error sending newsletter:', error.message)
    process.exit(1)
  }
}

// Run the script
sendNewsletter()
