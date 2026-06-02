import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, admin } from '@/lib/firebase'

async function handleUnsubscribe(email: string) {
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const db = getFirestore()
  const normalizedEmail = email.toLowerCase()
  const subscriberRef = db.collection('newsletter_subscribers').doc(normalizedEmail)

  try {
    const doc = await subscriberRef.get()

    if (!doc.exists) {
      console.error('Email not found:', email)
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    await subscriberRef.update({
      subscribed: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    console.log('Successfully unsubscribed:', email)
    return NextResponse.json({ message: 'Sorry to see you go!' }, { status: 200 })
  } catch (error) {
    console.error('Error unsubscribing:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    return await handleUnsubscribe(email)
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email')
    return await handleUnsubscribe(email || '')
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    )
  }
}
