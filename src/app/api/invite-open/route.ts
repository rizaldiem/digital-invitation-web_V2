import { supabase } from '@/lib/supabase/client'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json()

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    const { error } = await supabase.from('invite_opens').insert({
      slug,
      visited_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Error logging invite open:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in invite-open:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
