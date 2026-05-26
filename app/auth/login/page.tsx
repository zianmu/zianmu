'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Loader2, ShirtIcon, AlertCircle, ShieldCheck } from 'lucide-react'

const ADMIN_CODE = '2532'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [adminCode, setAdminCode] = useState('')
  const [adminCodeError, setAdminCodeError] = useState<string | null>(null)
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      
      // ส่งค่า username เข้าไปที่ฟิลด์ email ของ Supabase Auth
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      })

      if (signInError) throw signInError

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
    } finally {
      setLoading(false)
    }
  }

  const handleAdminVerify = (e: React.FormEvent) => {
    e.preventDefault()
    setAdminCodeError(null)

    if (adminCode === ADMIN_CODE) {
      setAdminDialogOpen(false)
      router.push('/admin')
    } else {
      setAdminCodeError('รหัสยืนยันผู้ดูแลระบบไม่ถูกต้อง')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <ShirtIcon className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">ระบบจัดการร้านซักรีด</CardTitle>
          <CardDescription>กรอกชื่อผู้ใช้และรหัสผ่านเพื่อเข้าสู่ระบบ</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">ชื่อผู้ใช้ (Username)</Label>
              <Input
                id="username"
                type="text"
                placeholder="กรอกชื่อผู้ใช้ของคุณ"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">รหัสผ่าน (Password)</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </Button>
          </form>

          <div className="mt-6 flex justify-center">
            <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  เข้าสู่ระบบผู้ดูแลระบบ (Admin)
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>ยืนยันสิทธิ์ผู้ดูแลระบบ</DialogTitle>
                  <DialogDescription>
                    กรุณากรอกรหัสผ่านผู้ดูแลระบบ (Admin Code) เพื่อเข้าใช้งานระบบจัดการหลังบ้าน
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAdminVerify} className="space-y-4 pt-4">
                  {adminCodeError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{adminCodeError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="adminCode">รหัสผ่านผู้ดูแลระบบ</Label>
                    <Input
                      id="adminCode"
                      type="password"
                      placeholder="••••"
                      maxLength={4}
                      value={adminCode}
                      onChange={(e) => setAdminCode(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    ยืนยันรหัส
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}