"use client"

import { Suspense } from "react"
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
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
              <ForgotPasswordForm />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-slate-950 lg:block">
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="max-w-md space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-primary/80">
              Secure Access
            </p>
            <h2 className="font-heading text-5xl leading-tight font-semibold">
              Reset your password and get back to work.
            </h2>
            <p className="text-base text-slate-300">
              Enter your email and we will send you a link to reset your password. It is quick and secure.
            </p>
          </div>
          <div className="max-w-md">
            <p className="text-sm text-slate-400 italic">
              &ldquo;Resetting my password took less than a minute. Back to managing my team in no time.&rdquo;
            </p>
            <p className="mt-2 text-sm font-medium text-slate-200">— Workspace Admin</p>
          </div>
        </div>
      </div>
    </div>
  )
}
