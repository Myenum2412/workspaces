"use client"

import { useState, useEffect, useRef } from "react"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchJson } from "@/lib/api/fetch-json"
import { API_BASE_URL } from "@/lib/api/config"
import Link from "next/link"
import { Copy, Check, Mail } from "lucide-react"

const COMPANY_RANGES = ["1-10", "11-50", "51-200", "201-1000", "1000+"]

interface RegisterResponse {
  success: boolean
  token?: string
  password?: string
  user?: any
  organization?: any
}

export function SignupForm() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [companyRange, setCompanyRange] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [validationError, setValidationError] = useState("")
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(10)
  const [registeredPassword, setRegisteredPassword] = useState("")
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const mutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; companyName: string; companyRange: string; email: string }) => {
      return fetchJson<RegisterResponse>(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, category: "Other" }),
      })
    },
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem("auth_token", data.token)
      }
      if (data.password) {
        setRegisteredPassword(data.password)
      }
    },
  })

  // Countdown tick
  useEffect(() => {
    if (!mutation.isSuccess || !registeredPassword) return
    const id = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    countdownRef.current = id
    return () => clearInterval(id)
  }, [mutation.isSuccess, registeredPassword])

  // Redirect when countdown reaches zero
  useEffect(() => {
    if (countdown === 0 && registeredPassword) {
      router.push("/workspace")
      router.refresh()
    }
  }, [countdown, registeredPassword, router])

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(registeredPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const input = document.getElementById("password-display") as HTMLInputElement
      if (input) {
        input.select()
        document.execCommand("copy")
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError("")

    if (!firstName || !lastName || !companyName || !companyRange || !email) {
      setValidationError("All fields are required.")
      return
    }

    mutation.mutate({ firstName, lastName, companyName, companyRange, email })
  }

  // Success state — show password + countdown
  if (mutation.isSuccess) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Account Created!</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Save this password. You&apos;ll need it to sign in.
          </p>
        </div>

        <div className="rounded-lg border border-emerald-500/20 bg-emerald-50 p-4 dark:bg-emerald-950/20">
          <p className="text-xs text-muted-foreground mb-2 text-center">Your auto-generated password</p>
          <div className="flex items-center gap-2">
            <Input
              id="password-display"
              readOnly
              value={registeredPassword}
              className="font-mono text-center text-lg tracking-wider bg-background select-all"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button type="button" variant="outline" size="icon" onClick={handleCopyPassword} title="Copy password">
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-50 p-3 dark:bg-blue-950/20">
          <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-400">
            Password also sent to <strong>{email}</strong>
          </p>
        </div>

        <div className="rounded-lg border border-amber-500/20 bg-amber-50 p-3 dark:bg-amber-950/20">
          <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
            Redirecting to workspace in <strong>{countdown}s</strong>...
          </p>
        </div>

        <Button className="w-full" onClick={() => router.push("/workspace")}>
          Go to Workspace Now
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-sm text-balance text-muted-foreground">
          Sign up and we&apos;ll generate a secure password for you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="bg-background"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            type="text"
            placeholder="Acme Inc."
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyRange">Company Range</Label>
          <Select value={companyRange ?? ""} onValueChange={setCompanyRange} required>
            <SelectTrigger id="companyRange" className="w-full bg-background">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_RANGES.map((range) => (
                <SelectItem key={range} value={range}>{range}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email ID</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-background"
          />
        </div>

        {validationError && (
          <p className="text-sm text-destructive">{validationError}</p>
        )}

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating..." : "Create account"}
        </Button>

        <div className="relative flex items-center gap-3 my-2">
          <div className="flex-1 border-t" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">or continue with</span>
          <div className="flex-1 border-t" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" className="w-full" onClick={() => window.location.href = `${API_BASE_URL}/api/auth/google`}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => window.location.href = `${API_BASE_URL}/api/auth/linkedin`}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="#0A66C2">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            LinkedIn
          </Button>
        </div>

        {mutation.isError && (
          <p className="text-sm text-destructive">
            {(mutation.error as Error).message}
          </p>
        )}
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="underline underline-offset-4">
          Sign in here
        </Link>
      </p>
    </div>
  )
}
