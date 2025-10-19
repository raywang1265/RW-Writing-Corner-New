import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

async function handleUnsubscribe(email: string) {
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .update({ subscribed: false, updated_at: new Date().toISOString() })
    .eq('email', email.toLowerCase())
    .select()

  if (error) {
    console.error('Error unsubscribing:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    )
  }

  if (!data || data.length === 0) {
    console.error('Email not found:', email)
    return NextResponse.json({ error: 'Email not found' }, { status: 404 })
  }

  console.log('Successfully unsubscribed:', email)
  return NextResponse.json({ message: 'Sorry to see you go!' }, { status: 200 })
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
