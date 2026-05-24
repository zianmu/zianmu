import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// PUT - Change user password
export async function PUT(request: Request) {
  try {
    const { userId, newPassword } = await request.json()

    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'กรุณาระบุข้อมูลให้ครบ' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' }, { status: 500 })
  }
}
