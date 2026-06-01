"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiFetch } from "@/lib/api/client"
import Link from "next/link"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const email = searchParams.get("email") || ""

  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const mutation = useMutation({
    mutationFn: async (data: { email: string; token: string; otp: string; password: string }) => {
      return apiFetch(`/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      router.push("/login?reset=success")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      mutation.isError
      return
    }
    mutation.mutate({ email, token, otp, password })
  }

  if (!token || !email) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-destructive font-medium">Invalid or missing reset link.</p>
        <Link href="/forgot-password" className="text-sm text-primary underline">
          Request a new reset link
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold">Reset password</h1>
        <p className="text-sm text-balance text-muted-foreground">
          Enter the OTP from your email and choose a new password.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp">One-Time Password (OTP)</Label>
          <Input
            id="otp"
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
            className="bg-background text-center text-lg tracking-[8px] font-mono"
            maxLength={6}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="bg-background"
          />
          {password && confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={mutation.isPending || password !== confirmPassword || !otp}>
          {mutation.isPending ? "Resetting..." : "Reset password"}
        </Button>
        {mutation.isError && (
          <p className="text-sm text-destructive text-center">{(mutation.error as Error).message}</p>
        )}
        {mutation.isSuccess && (
          <p className="text-sm text-primary text-center">Password reset successfully! Redirecting...</p>
        )}
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <Suspense fallback={<div className="animate-pulse text-muted-foreground">Loading...</div>}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-slate-950 lg:block">
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="max-w-md space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-primary/80">
              Secure Reset
            </p>
            <h2 className="font-heading text-5xl leading-tight font-semibold">
              Enter the OTP and set a new password.
            </h2>
            <p className="text-base text-slate-300">
              Check your email for the 6-digit OTP, then create a strong password to secure your account.
            </p>
          </div>
          <div className="max-w-md">
            <p className="text-sm text-slate-400 italic">
              &ldquo;Quick and secure. I was back in my account within minutes.&rdquo;
            </p>
            <p className="mt-2 text-sm font-medium text-slate-200">— Workspace User</p>
          </div>
        </div>
      </div>
    </div>
  )
}
