import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// PUT - Change user role
export async function PUT(request: Request) {
  try {
    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json({ error: 'กรุณาระบุข้อมูลให้ครบ' }, { status: 400 })
    }

    if (!['admin', 'staff'].includes(role)) {
      return NextResponse.json({ error: 'สิทธิ์ไม่ถูกต้อง' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error changing role:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการเปลี่ยนสิทธิ์' }, { status: 500 })
  }
}
