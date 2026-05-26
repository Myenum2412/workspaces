import { SignupForm } from "@/components/forms/signup-form"

export default function SignupPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <SignupForm />
          </div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-slate-950 lg:block">
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="max-w-md space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/80">
              Join the Team
            </p>
            <h2 className="font-heading text-5xl leading-tight font-semibold">
              Create your account and start collaborating.
            </h2>
            <p className="text-base text-slate-300">
              Sign up to join the organization, manage tasks, and work together with your team in real time.
            </p>
          </div>
          <div className="grid max-w-xl grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-semibold">Easy</p>
              <p className="mt-1 text-sm text-slate-300">Quick signup process</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-semibold">Secure</p>
              <p className="mt-1 text-sm text-slate-300">Enterprise-grade security</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-semibold">Fast</p>
              <p className="mt-1 text-sm text-slate-300">Instant team access</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
