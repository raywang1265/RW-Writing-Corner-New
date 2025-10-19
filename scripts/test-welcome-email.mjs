#!/usr/bin/env node

/**
 * Test Welcome Email Script
 *
 * This script sends a test welcome email to verify the template looks correct.
 *
 * Usage:
 *   node scripts/test-welcome-email.mjs your-email@example.com
 */

import { config } from 'dotenv'
import { Resend } from 'resend'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: '.env.local' })

// Parse command line arguments
const args = process.argv.slice(2)

if (args.length === 0) {
  console.error('Usage: node scripts/test-welcome-email.mjs <email-address>')
  console.error('Example: node scripts/test-welcome-email.mjs your-email@example.com')
  process.exit(1)
}

const testEmail = args[0]

// Validate email format
if (!testEmail.includes('@')) {
  console.error('Error: Invalid email address format')
  process.exit(1)
}

// Initialize Resend
const resendApiKey = process.env.RESEND_API_KEY

if (!resendApiKey) {
  console.error('Missing RESEND_API_KEY environment variable')
  console.error('Please add it to your .env.local file')
  process.exit(1)
}

const resend = new Resend(resendApiKey)

// Email configuration
const FROM_EMAIL = process.env.NEWSLETTER_FROM_EMAIL || 'newsletter@yourdomain.com'
const FROM_NAME = process.env.NEWSLETTER_FROM_NAME || 'RW Writing Corner'
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://tailwind-nextjs-starter-blog.vercel.app'

async function sendTestWelcomeEmail() {
  console.log('📧 Testing welcome email...')
  console.log(`📮 Sending to: ${testEmail}`)
  console.log('')

  try {
    // Read the welcome email template
    const templatePath = resolve(process.cwd(), 'newsletter-templates', 'welcome.html')
    let htmlContent = readFileSync(templatePath, 'utf-8')

    // Replace placeholders
    htmlContent = htmlContent.replace(/{{SITE_URL}}/g, SITE_URL)
    htmlContent = htmlContent.replace(/{{EMAIL}}/g, encodeURIComponent(testEmail))

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
Unsubscribe: ${SITE_URL}/unsubscribe?email=${encodeURIComponent(testEmail)}
    `.trim()

    // Send the email with both HTML and plain text versions
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: testEmail,
      subject: `[TEST] Welcome to ${FROM_NAME}`,
      html: htmlContent,
      text: textContent,
    })

    if (error) {
      console.error('❌ Error sending test email:', error)
      process.exit(1)
    }

    console.log('✅ Test email sent successfully!')
    console.log('📊 Email ID:', data.id)
    console.log('')
    console.log('Check your inbox to see how the welcome email looks.')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the script
sendTestWelcomeEmail()
