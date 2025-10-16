import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const supabase = await createClient()

    // Update subscriber to unsubscribed
    const { error: updateError } = await supabase
      .from('newsletter_subscribers')
      .update({ subscribed: false, updated_at: new Date().toISOString() })
      .eq('email', email.toLowerCase())

    if (updateError) {
      console.error('Error unsubscribing:', updateError)
      return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
    }

    return NextResponse.json(
      { message: 'Successfully unsubscribed. Sorry to see you go!' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const email = searchParams.get('email')

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const supabase = await createClient()

    // Update subscriber to unsubscribed
    const { error: updateError } = await supabase
      .from('newsletter_subscribers')
      .update({ subscribed: false, updated_at: new Date().toISOString() })
      .eq('email', email.toLowerCase())

    if (updateError) {
      console.error('Error unsubscribing:', updateError)
      return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
    }

    return NextResponse.json(
      { message: 'Successfully unsubscribed. Sorry to see you go!' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
