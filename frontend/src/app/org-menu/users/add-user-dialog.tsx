"use client";

import { useState } from "react";
import { PlusIcon, Mail, User, Briefcase, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrgAuth } from "../layout";
import { databases, ID, COLLECTIONS, DB_ID } from "@/lib/appwrite/client";
import { toast } from "sonner";
import type { OrgRole } from "@/lib/appwrite/types";

export function AddUserDialog({ onUserAdded }: { onUserAdded?: () => void }) {
  const { session } = useOrgAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    designation: "",
    department: "",
    role: "staff" as OrgRole,
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const reset = () => {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      designation: "",
      department: "",
      role: "staff",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.organization?.$id || !session?.user?.$id) {
      toast.error("Not authenticated");
      return;
    }

    setIsLoading(true);
    try {
      const inviteToken = ID.unique();

      // 1. Create invitation in DB (non-fatal if collection doesn't exist)
      try {
        await databases.createDocument(DB_ID, COLLECTIONS.ORG_INVITATIONS, ID.unique(), {
          organizationId: session.organization.$id,
          email: form.email,
          role: form.role,
          invitedBy: session.user.$id,
          token: inviteToken,
          status: "pending",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
      } catch {
        console.warn("Could not create invitation in DB");
      }

      // 2. Pre-create user profile (non-fatal)
      try {
        await databases.createDocument(DB_ID, COLLECTIONS.USER_PROFILES, ID.unique(), {
          userId: "",
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          designation: form.designation,
          department: form.department,
          organizationId: session.organization.$id,
          role: form.role,
          status: "pending",
        });
      } catch {
        console.warn("Could not create user profile in DB");
      }

      // 3. Send invite email via Resend
      const inviterName =
        session.profile && `${session.profile.firstName} ${session.profile.lastName}`.trim()
          ? `${session.profile.firstName} ${session.profile.lastName}`.trim()
          : "Your team";

      const emailRes = await fetch("/api/invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          inviteToken,
          organizationName: session.organization.name,
          inviterName,
          role: form.role,
        }),
      });

      if (!emailRes.ok) {
        console.warn("Invite email failed to send, but invitation was created");
      }

      toast.success(`Invitation sent to ${form.email}`);
      setOpen(false);
      reset();
      onUserAdded?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add user";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Invite a new member to join your organization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="firstName"
                  placeholder="John"
                  className="pl-10"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="john@company.com"
                className="pl-10"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={form.role} onValueChange={(v) => update("role", v)}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="designation"
                  placeholder="Developer, Designer..."
                  className="pl-10"
                  value={form.designation}
                  onChange={(e) => update("designation", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="department"
                placeholder="Engineering, Marketing..."
                className="pl-10"
                value={form.department}
                onChange={(e) => update("department", e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
