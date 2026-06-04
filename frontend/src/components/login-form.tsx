"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { API_BASE_URL } from "@/lib/api/config";
import { authApi } from "@/lib/api/client";

export function LoginForm({ className }: { className?: string }) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [registeredMessage, setRegisteredMessage] = useState("");
  const [resetMessage, setResetMessage] = useState("");

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
    } catch {
      /* ignore */
    }
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
      </form>

      <div className="text-center">
        <span className="text-sm text-muted-foreground">Don&apos;t have an account?</span>{" "}
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
