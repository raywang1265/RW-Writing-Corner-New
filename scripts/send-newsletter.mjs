#!/usr/bin/env node

/**
 * Newsletter Sending Script
 *
 * Interactively prompts for a story (searching data/stories for a match),
 * renders it into the newsletter-templates/new-story.html template, and
 * sends it to subscribers via Resend.
 *
 * Usage:
 *   node scripts/send-newsletter.mjs
 *   node scripts/send-newsletter.mjs --story "ghosts"
 *   node scripts/send-newsletter.mjs --test you@example.com
 *   node scripts/send-newsletter.mjs --dry-run
 */

import { config } from 'dotenv'
import admin from 'firebase-admin'
import { Resend } from 'resend'
import matter from 'gray-matter'
import { readFileSync, readdirSync } from 'fs'
import { resolve, basename } from 'path'
import { createInterface } from 'readline/promises'
import siteMetadata from '../data/siteMetadata.js'

// Load environment variables
config({ path: '.env.local' })

const STORIES_DIR = resolve(process.cwd(), 'data', 'stories')
const TEMPLATE_PATH = resolve(process.cwd(), 'newsletter-templates', 'new-story.html')
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || siteMetadata.siteUrl

// Parse command line arguments
const args = process.argv.slice(2)
const getArg = (flag) => {
  const index = args.indexOf(flag)
  return index !== -1 ? args[index + 1] : null
}

const isDryRun = args.indexOf('--dry-run') !== -1
const isTest = args.indexOf('--test') !== -1
const testEmail = isTest ? getArg('--test') : null
const storyQueryArg = getArg('--story')

const subject = 'New Story Available!'

if (isTest && (!testEmail || testEmail.startsWith('--'))) {
  console.error('Error: --test requires an email address. (e.g., --test you@example.com)')
  process.exit(1)
}

const rl = createInterface({ input: process.stdin, output: process.stdout })
const prompt = async (question) => (await rl.question(question)).trim()

// Normalize a string for fuzzy matching (lowercase, strip non-alphanumerics)
const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '')

// Discover every story in data/stories along with its parsed frontmatter
function loadStories() {
  const files = readdirSync(STORIES_DIR).filter((f) => f.endsWith('.mdx'))
  return files.map((file) => {
    const filePath = resolve(STORIES_DIR, file)
    const raw = readFileSync(filePath, 'utf-8')
    const { data } = matter(raw)
    const slug = basename(file, '.mdx')
    return {
      slug,
      file,
      filePath,
      title: data.title || slug,
      summary: data.summary || '',
      draft: Boolean(data.draft),
    }
  })
}

// Find stories matching a (partial) name against slug/filename or title
function findMatches(stories, query) {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) return []

  // Exact slug/filename match wins outright
  const exact = stories.find((s) => normalize(s.slug) === normalizedQuery)
  if (exact) return [exact]

  return stories.filter(
    (s) =>
      normalize(s.slug).includes(normalizedQuery) || normalize(s.title).includes(normalizedQuery)
  )
}

// Prompt the user until a single story is selected
async function selectStory() {
  const stories = loadStories()

  if (stories.length === 0) {
    console.error(`No stories found in ${STORIES_DIR}`)
    process.exit(1)
  }

  let query = storyQueryArg
  if (!query) {
    query = await prompt('📚 Enter the story name (title or filename, partial match ok): ')
  }

  let matches = findMatches(stories, query)

  while (matches.length !== 1) {
    if (matches.length === 0) {
      console.log(`\nNo stories matched "${query}". Available stories:`)
      stories.forEach((s) => console.log(`   - ${s.title} (${s.slug})`))
    } else {
      console.log(`\nMultiple stories matched "${query}":`)
      matches.forEach((s, i) => console.log(`   ${i + 1}. ${s.title} (${s.slug})`))
      const choice = await prompt('Enter the number of the story to send (or a new search term): ')
      const asIndex = Number(choice)
      if (Number.isInteger(asIndex) && asIndex >= 1 && asIndex <= matches.length) {
        return matches[asIndex - 1]
      }
      query = choice
      matches = findMatches(stories, query)
      continue
    }

    query = await prompt('📚 Enter the story name (title or filename, partial match ok): ')
    matches = findMatches(stories, query)
  }

  return matches[0]
}

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
async function getSubscribers(db) {
  const snapshot = await db
    .collection('newsletter_subscribers')
    .where('subscribed', '==', true)
    .get()

  if (snapshot.empty) return []
  return snapshot.docs.map((doc) => doc.data().email)
}

// Send Single Email
async function sendEmail(resend, fromHeader, email, subject, html) {
  try {
    const { data, error } = await resend.emails.send({
      from: fromHeader,
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

async function runDryRun({ story, htmlTemplate, storyUrl, db, resend }) {
  console.log('🧪 DRY RUN — no emails will be sent.\n')

  // 1. Confirm the story exists (already resolved, but re-confirm the file is readable)
  try {
    readFileSync(story.filePath, 'utf-8')
    console.log(`✅ Story found: "${story.title}" (${story.slug})`)
    if (story.draft) {
      console.log('   ⚠️  Warning: this story is marked as draft: true')
    }
  } catch (error) {
    console.log(`❌ Could not read story file: ${error.message}`)
  }
  console.log('')

  // 2. Confirm the database is reachable and list subscribers
  let subscribers = []
  try {
    subscribers = await getSubscribers(db)
    console.log(
      `✅ Database reachable (Firestore). Found ${subscribers.length} active subscriber(s):`
    )
    if (subscribers.length === 0) {
      console.log('   (no active subscribers)')
    } else {
      subscribers.forEach((email, i) => console.log(`   ${i + 1}. ${email}`))
    }
  } catch (error) {
    console.log(`❌ Database NOT reachable: ${error.message}`)
  }
  console.log('')

  // 3. Confirm Resend is reachable
  try {
    const { error } = await resend.domains.list()
    if (error) throw new Error(error.message || JSON.stringify(error))
    console.log('✅ Resend API reachable.')
  } catch (error) {
    console.log(`❌ Resend API NOT reachable: ${error.message}`)
  }
  console.log('')

  // 4. Show what the email content would render to
  const sampleEmail = subscribers[0] || testEmail || 'subscriber@example.com'
  const emailData = {
    TITLE: story.title,
    STORY_EXCERPT: story.summary,
    STORY_URL: storyUrl,
    SITE_URL: SITE_URL,
    EMAIL: encodeURIComponent(sampleEmail),
  }
  const renderedHtml = injectVariables(htmlTemplate, emailData)

  console.log(`📧 Subject: ${subject}`)
  console.log(`📨 Example recipient: ${sampleEmail}`)
  console.log('📝 Rendered email HTML:\n')
  console.log(renderedHtml)
}

async function sendNewsletter({ story, htmlTemplate, storyUrl, db, resend, fromHeader }) {
  console.log('🚀 Starting newsletter send...')
  console.log(`📧 Subject: ${subject}`)
  console.log(`🧪 Test mode: ${isTest ? 'YES' : 'NO'}\n`)

  try {
    let emailsToSend = []

    if (isTest) {
      console.log(`🧪 Sending only to ${testEmail}\n`)
      emailsToSend = [testEmail]
    } else {
      const subscribers = await getSubscribers(db)
      console.log(`📊 Found ${subscribers.length} active subscriber(s)\n`)
      if (subscribers.length === 0) return
      emailsToSend = subscribers
    }

    let successCount = 0
    let failCount = 0

    for (let i = 0; i < emailsToSend.length; i++) {
      const email = emailsToSend[i]

      const emailData = {
        TITLE: story.title,
        STORY_EXCERPT: story.summary,
        STORY_URL: storyUrl,
        SITE_URL: SITE_URL,
        EMAIL: encodeURIComponent(email),
      }

      const personalizedHtml = injectVariables(htmlTemplate, emailData)
      const result = await sendEmail(resend, fromHeader, email, subject, personalizedHtml)

      if (result.success) {
        successCount++
        console.log(`✅ Sent to ${email}`)
      } else {
        failCount++
        console.error(`❌ Failed to send to ${email}: ${result.error}`)
      }

      if (i < emailsToSend.length - 1) {
        await new Promise((r) => setTimeout(r, 100))
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

async function main() {
  try {
    const story = await selectStory()
    console.log(`\n📄 Selected story: "${story.title}" (${story.slug})`)
    console.log(`   Excerpt: ${story.summary.substring(0, 80)}...\n`)

    const htmlTemplate = readFileSync(TEMPLATE_PATH, 'utf-8')
    const storyUrl = `${SITE_URL}/stories/${story.slug}`

    // Initialize Firebase Admin & Resend
    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
    const resendApiKey = process.env.RESEND_API_KEY

    if (!projectId || !clientEmail || !privateKey || !resendApiKey) {
      console.error('Missing Firebase or Resend environment variables')
      process.exit(1)
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      })
    }

    const db = admin.firestore()
    const resend = new Resend(resendApiKey)

    const FROM_EMAIL = process.env.NEWSLETTER_FROM_EMAIL || 'newsletter@yourdomain.com'
    const FROM_NAME = process.env.NEWSLETTER_FROM_NAME || 'RW Writing Corner'
    const fromHeader = `${FROM_NAME} <${FROM_EMAIL}>`

    rl.close()

    if (isDryRun) {
      await runDryRun({ story, htmlTemplate, storyUrl, db, resend })
      return
    }

    await sendNewsletter({ story, htmlTemplate, storyUrl, db, resend, fromHeader })
  } catch (error) {
    console.error('❌ Error:', error.message)
    rl.close()
    process.exit(1)
  }
}

main()
