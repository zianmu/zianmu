import { redirect } from 'next/navigation'

export default function HomePage() {
  // Middleware handles auth check - just redirect to login
  // If user is logged in, middleware will redirect them to dashboard
  redirect('/auth/login')
}
