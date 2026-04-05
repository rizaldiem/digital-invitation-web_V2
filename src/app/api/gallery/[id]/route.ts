import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Missing gallery ID' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: item, error: fetchError } = await supabase
      .from('gallery')
      .select('url')
      .eq('id', id)
      .single()

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    if (item.url) {
      try {
        const urlParts = item.url.split('/')
        const fileName = urlParts[urlParts.length - 1].split('?')[0]
        if (fileName) {
          await supabase.storage.from('wedding-gallery').remove([fileName])
        }
      } catch (storageError) {
        console.error('Storage delete error:', storageError)
      }
    }

    const { error: deleteError } = await supabase
      .from('gallery')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
