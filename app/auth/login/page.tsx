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
      if (!supabase) {
        setError('ระบบยังไม่พร้อม กรุณารีเฟรชหน้า')
        return
      }

      // Look up email by username
      const res = await fetch('/api/auth/get-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: username }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password,
      })

      if (error) {
        if (error.message === 'Invalid login credentials') {
          setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
        } else {
          setError(error.message)
        }
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  const handleAdminAccess = () => {
    setAdminCodeError(null)
    if (adminCode === ADMIN_CODE) {
      // Store admin access in sessionStorage
      sessionStorage.setItem('adminAccess', 'true')
      setAdminDialogOpen(false)
      router.push('/admin/setup')
    } else {
      setAdminCodeError('รหัสแอดมินไม่ถูกต้อง')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary">
              <ShirtIcon className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">ระบบจัดการผ้าโรงแรมเดอะพีค</CardTitle>
          <CardDescription>
            เข้าสู่ระบบเพื่อจัดการผ้าโรงแรมเดอะพีคของคุณ
          </CardDescription>
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
              <Label htmlFor="username">ชื่อผู้ใช้</Label>
              <Input
                id="username"
                type="text"
                placeholder="กรอกชื่อผู้ใช้"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input
                id="password"
                type="password"
                placeholder="รหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
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

          <div className="mt-6 pt-4 border-t">
            <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  เข้าสู่ระบบแอดมิน
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>เข้าสู่ระบบแอดมิน</DialogTitle>
                  <DialogDescription>
                    กรุณากรอกรหัสแอดมินเพื่อเข้าสู่ระบบจัดการ
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  {adminCodeError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{adminCodeError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="adminCode">รหัสแอดมิน</Label>
                    <Input
                      id="adminCode"
                      type="password"
                      placeholder="กรอกรหัสแอดมิน"
                      value={adminCode}
                      onChange={(e) => setAdminCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAdminAccess()
                        }
                      }}
                    />
                  </div>
                  <Button onClick={handleAdminAccess} className="w-full">
                    เข้าสู่ระบบ
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
