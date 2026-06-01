"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiFetch } from "@/lib/api/client"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const mutation = useMutation({
    mutationFn: async (email: string) => {
      return apiFetch(`/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      mutation.mutate(email)
    }
  }

  if (mutation.isSuccess) {
    return (
      <div className="flex flex-col gap-6 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold">Check your email</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We sent a password reset link and OTP to <strong>{email}</strong>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold">Forgot password</h1>
        <p className="text-sm text-balance text-muted-foreground">
          Enter your email to receive a password reset link.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-background"
          />
        </div>
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Sending..." : "Send reset link"}
        </Button>
        {mutation.isError && (
          <p className="text-sm text-destructive text-center">{(mutation.error as Error).message}</p>
        )}
      </form>
    </div>
  )
}
