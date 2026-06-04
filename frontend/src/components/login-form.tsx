"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { API_BASE_URL } from "@/lib/api/config";
import { authApi } from "@/lib/api/client";

export function LoginForm({
  className,
}: { className?: string }) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [registeredMessage, setRegisteredMessage] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [generatedPassword] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const registered = params.get("registered");
    const reset = params.get("reset");
    const reason = params.get("reason");

    setTimeout(() => {
      if (registered === "true") {
        setRegisteredMessage("Account created! Check your email for the password.");
      }
      if (reset === "success") {
        setResetMessage("Password reset successfully! Sign in with your new password.");
      }
      if (reason === "session_expired") {
        setErrorMessage("Session expired. Please sign in again.");
      }
    }, 0);
    try {
      localStorage.removeItem("auth_token");
    } catch { /* ignore */ }
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await fetch(`${API_BASE_URL}/api/auth/csrf-token`, { credentials: "include" });
      const csrfMatch = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
      const csrfToken = csrfMatch ? decodeURIComponent(csrfMatch[1]) : "";

      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (!res.ok) {
        setErrorMessage(json.error?.message || "Invalid email or password");
        return;
      }

      try {
        const me = await authApi.getMe();
        const user = (me as any).data?.user || me.user;
        if (user?.role === "ORG_ADMIN") {
          router.push("/org-menu");
        } else if (user?.role === "staff") {
          router.push("/members/dashboard");
        } else {
          router.push("/workspace");
        }
      } catch {
        router.push("/workspace");
      }
      router.refresh();
    } catch {
      setErrorMessage("Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (generatedPassword) {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Account Created!</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Your account has been created. Use the password below to sign in.
          </p>
        </div>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Your auto-generated password</p>
          <p className="text-lg font-mono font-bold tracking-wider text-primary select-all">
            {generatedPassword}
          </p>
        </div>

        <div className="rounded-lg border border-amber-500/20 bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
          Please save this password. You won&apos;t be able to see it again after leaving this page.
        </div>

        <Link href="/login">
          <Button className="w-full">Go to Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-sm text-balance text-muted-foreground">
          Sign in to manage your tasks, teams, and workspace.
        </p>
      </div>

      {registeredMessage ? (
        <FieldDescription className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-center text-primary">
          {registeredMessage}
        </FieldDescription>
      ) : null}
      {resetMessage ? (
        <FieldDescription className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-center text-primary">
          {resetMessage}
        </FieldDescription>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder=""
            required
            className="bg-background"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            required
            className="bg-background"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {errorMessage ? (
          <FieldDescription className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-center text-red-600 font-medium dark:text-red-400">
            {errorMessage}
          </FieldDescription>
        ) : null}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing In..." : "Sign In"}
        </Button>

        <div className="relative flex items-center gap-3 my-2">
          <div className="flex-1 border-t" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">or continue with</span>
          <div className="flex-1 border-t" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" className="w-full" onClick={() => window.location.href = `${API_BASE_URL}/api/auth/google`}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => window.location.href = `${API_BASE_URL}/api/auth/linkedin`}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="#0A66C2">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            LinkedIn
          </Button>
        </div>
      </form>

      <div className="text-center">
        dont have an account?
        <Link
          href="/signup"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}
