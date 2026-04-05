import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function DELETE() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data: items, error: fetchError } = await supabase
      .from('gallery')
      .select('url')

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (items && items.length > 0) {
      for (const item of items) {
        if (item.url) {
          try {
            const urlParts = item.url.split('/')
            const fileName = urlParts[urlParts.length - 1].split('?')[0]
            if (fileName) {
              await supabase.storage.from('wedding-gallery').remove([fileName])
            }
          } catch (e) {
            console.error('Storage delete error:', e)
          }
        }
      }
    }

    const { error: deleteError } = await supabase
      .from('gallery')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, deleted: items?.length || 0 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
