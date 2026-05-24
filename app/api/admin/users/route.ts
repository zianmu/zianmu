import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET - List all users
export async function GET() {
  try {
    const supabase = createAdminClient()

    // Get users from auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Get profiles with roles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    // Merge auth users with profiles
    const users = profiles?.map((profile) => {
      const authUser = authUsers.users.find((u) => u.id === profile.id)
      return {
        id: profile.id,
        email: authUser?.email || '',
        name: profile.name,
        role: profile.role,
        created_at: profile.created_at,
      }
    }) || []

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 })
  }
}

// POST - Create new user
export async function POST(request: Request) {
  try {
    const { email, name, password, role } = await request.json()

    if (!email || !name || !password) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Create user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { name },
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json({ error: 'อีเมลนี้มีอยู่ในระบบแล้ว' }, { status: 400 })
      }
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'ไม่สามารถสร้างผู้ใช้ได้' }, { status: 500 })
    }

    // Update profile role if needed (trigger creates profile with default role)
    if (role && role !== 'staff') {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role, name })
        .eq('id', authData.user.id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
      }
    }

    return NextResponse.json({ success: true, userId: authData.user.id })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้างผู้ใช้' }, { status: 500 })
  }
}

// DELETE - Delete user
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'กรุณาระบุ userId' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Delete user from auth (this will cascade delete profile due to FK constraint)
    const { error } = await supabase.auth.admin.deleteUser(userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบผู้ใช้' }, { status: 500 })
  }
}
