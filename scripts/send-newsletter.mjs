#!/usr/bin/env node

/**
 * Newsletter Sending Script
 *
 * This script reads an MDX file for a title and excerpt, injects them into an HTML template,
 * and sends a newsletter.
 *
 * Usage:
 * node scripts/send-newsletter.mjs --content "template.html" --mdx "story.mdx" --url "https://yoursite.com/story"
 *
 * Test run:
 * node scripts/send-newsletter.mjs --test test@example.com --content "template.html" --mdx "story.mdx" --url "https://yoursite.com/story"
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load environment variables
config({ path: '.env.local' })

// Parse command line arguments
const args = process.argv.slice(2)
const getArg = (flag) => {
  const index = args.indexOf(flag)
  return index !== -1 ? args[index + 1] : null
}

const isTest = args.indexOf('--test') !== -1
const testEmail = isTest ? getArg('--test') : null
const contentPath = getArg('--content')
const htmlContentRaw = getArg('--html')
const mdxPath = getArg('--mdx')
const storyUrl = getArg('--url') || '#'

// Hardcoded Subject
const subject = 'New Story Available!'

if (isTest && (!testEmail || testEmail.startsWith('--'))) {
  console.error('Error: --test requires an email address. (e.g., --test you@example.com)')
  process.exit(1)
}

if ((!contentPath && !htmlContentRaw) || !mdxPath) {
  console.error(
    'Usage: node send-newsletter.mjs --content "template.html" --mdx "story.mdx" [--url "link"] [--test email]'
  )
  process.exit(1)
}

// 1. Read the HTML Template
let htmlTemplate = htmlContentRaw
if (!htmlTemplate) {
  try {
    htmlTemplate = readFileSync(resolve(contentPath), 'utf-8')
  } catch (error) {
    console.error('Error reading HTML template:', error.message)
    process.exit(1)
  }
}

// 2. Read and Parse the MDX File
let storyTitle = ''
let storyExcerpt = ''

try {
  const mdxContent = readFileSync(resolve(mdxPath), 'utf-8')

  // Extract Title (handles 'quotes', "quotes", or no quotes)
  const titleMatch = mdxContent.match(/^title:\s*(?:'([^']+)'|"([^"]+)"|(.+))$/m)
  storyTitle = titleMatch ? (titleMatch[1] || titleMatch[2] || titleMatch[3]).trim() : 'New Story'

  // Extract Summary
  const summaryMatch = mdxContent.match(/^summary:\s*(?:'([^']+)'|"([^"]+)"|(.+))$/m)
  storyExcerpt = summaryMatch ? (summaryMatch[1] || summaryMatch[2] || summaryMatch[3]).trim() : ''

  console.log(`📄 Found MDX Data:`)
  console.log(`   Title: ${storyTitle}`)
  console.log(`   Excerpt: ${storyExcerpt.substring(0, 50)}...`)
  console.log('')
} catch (error) {
  console.error('Error reading MDX file:', error.message)
  process.exit(1)
}

// Initialize Clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const resendApiKey = process.env.RESEND_API_KEY

if (!supabaseUrl || !supabaseKey || !resendApiKey) {
  console.error('Missing Supabase or Resend environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const resend = new Resend(resendApiKey)

// Configuration
const FROM_EMAIL = process.env.NEWSLETTER_FROM_EMAIL || 'newsletter@yourdomain.com'
const FROM_NAME = process.env.NEWSLETTER_FROM_NAME || 'RW Writing Corner'
const SITE_URL = 'https://rwwritingcorner.com'

// Helper: Inject Variables into HTML
function injectVariables(html, variables) {
  let populatedHtml = html
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    populatedHtml = populatedHtml.replace(regex, value || '')
  }
  return populatedHtml
}

// Fetch Subscribers
async function getSubscribers() {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('email')
    .eq('subscribed', true)

  if (error) throw new Error(`Failed to fetch subscribers: ${error.message}`)
  return data.map((sub) => sub.email)
}

// Send Single Email
async function sendEmail(email, subject, html) {
  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: subject,
      html: html,
    })
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Main Execution
async function sendNewsletter() {
  console.log('🚀 Starting newsletter send...')
  console.log(`📧 Subject: ${subject}`)
  console.log(`🧪 Test mode: ${isTest ? 'YES' : 'NO'}\n`)

  try {
    let emailsToSend = []

    if (isTest) {
      console.log(`🧪 Sending only to ${testEmail}\n`)
      emailsToSend = [testEmail]
    } else {
      const subscribers = await getSubscribers()
      console.log(`📊 Found ${subscribers.length} active subscriber(s)\n`)
      if (subscribers.length === 0) return
      emailsToSend = subscribers
    }

    let successCount = 0
    let failCount = 0

    // Process and send loop
    for (let i = 0; i < emailsToSend.length; i++) {
      const email = emailsToSend[i]

      // Setup dynamic data payload for this specific email
      const emailData = {
        TITLE: storyTitle,
        STORY_EXCERPT: storyExcerpt,
        STORY_URL: storyUrl,
        SITE_URL: SITE_URL,
        EMAIL: encodeURIComponent(email),
      }

      // Inject data into HTML
      const personalizedHtml = injectVariables(htmlTemplate, emailData)

      // Dispatch
      const result = await sendEmail(email, subject, personalizedHtml)

      if (result.success) {
        successCount++
        console.log(`✅ Sent to ${email}`)
      } else {
        failCount++
        console.error(`❌ Failed to send to ${email}: ${result.error}`)
      }

      // 100ms rate limiting for Resend
      if (i < emailsToSend.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    console.log('\n📈 Newsletter Send Complete!')
    console.log(`✅ Successful: ${successCount}`)
    console.log(`❌ Failed: ${failCount}`)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

sendNewsletter()
