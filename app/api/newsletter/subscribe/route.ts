import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const supabase = await createClient()

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
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
    }

    return NextResponse.json(
      { message: 'Successfully subscribed! Thank you for subscribing.' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
