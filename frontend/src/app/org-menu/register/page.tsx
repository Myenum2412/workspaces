"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, User, Mail, Lock, Briefcase, Phone, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

export default function OrgRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    organizationName: "", phone: "", designation: "",
  });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const validateStep1 = () => {
    if (!form.name.trim()) { toast.error("Name is required"); return false; }
    if (!form.email.trim()) { toast.error("Email is required"); return false; }
    if (!form.password || form.password.length < 8) { toast.error("Password must be at least 8 characters"); return false; }
    if (form.password !== form.confirmPassword) { toast.error("Passwords do not match"); return false; }
    return true;
  };

  const handleNext = () => { if (validateStep1()) setStep(2); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { name, email, password, organizationName, phone, designation } = form;
      const result = await api.post<{ success: boolean; accessToken: string; refreshToken: string; user: any; organization: any }>("/api/auth/register", {
        firstName: name.split(" ")[0] || name,
        lastName: name.split(" ").slice(1).join(" ") || "",
        email,
        password,
        companyName: organizationName || `${name}'s Organization`,
        category: "Other",
        companyRange: "1-10",
        phone: phone || undefined,
        designation: designation || undefined,
      });

      // Cookies set by server automatically
      toast.success("Account created! Welcome.");
      router.push("/workspace");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white mb-4">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create your organization</h1>
          <p className="text-sm text-slate-500 mt-1">Set up your organization and start collaborating</p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"}`}>
              {step > 1 ? <CheckCircle className="w-4 h-4" /> : "1"}
            </div>
            <span className="text-sm font-medium text-slate-700">Account</span>
          </div>
          <div className="w-12 h-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"}`}>2</div>
            <span className="text-sm font-medium text-slate-700">Organization</span>
          </div>
        </div>

        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle>{step === 1 ? "Create your account" : "Organization details"}</CardTitle>
            <CardDescription>{step === 1 ? "Enter your personal details to get started" : "Tell us about your organization"}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 w-4 text-slate-400" />
                      <Input id="name" placeholder="John Doe" className="pl-10" value={form.name} onChange={(e) => update("name", e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input id="email" type="email" placeholder="" className="pl-10" value={form.email} onChange={(e) => update("email", e.target.value)} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input id="password" type="password" placeholder="Min 8 chars" className="pl-10" value={form.password} onChange={(e) => update("password", e.target.value)} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input id="confirmPassword" type="password" placeholder="Repeat password" className="pl-10" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required />
                      </div>
                    </div>
                  </div>
                  <Button type="button" className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleNext}>
                    Continue <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="organizationName">Organization Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input id="organizationName" placeholder="Acme Inc." className="pl-10" value={form.organizationName} onChange={(e) => update("organizationName", e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="designation">Your Role</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input id="designation" placeholder="CEO, Manager..." className="pl-10" value={form.designation} onChange={(e) => update("designation", e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input id="phone" placeholder="+91 98765 43210" className="pl-10" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                    <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
                      {isLoading ? "Creating..." : "Create Organization"}
                    </Button>
                  </div>
                </>
              )}
            </form>
            <div className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="text-emerald-600 font-medium hover:underline">Sign in</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
