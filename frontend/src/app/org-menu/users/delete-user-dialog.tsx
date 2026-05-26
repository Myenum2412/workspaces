"use client";

import { useState } from "react";
import { Trash2Icon, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { databases, Query, COLLECTIONS, DB_ID } from "@/lib/appwrite/client";
import { toast } from "sonner";

export function DeleteUserDialog({
  userId,
  userName,
  onDeleted,
}: {
  userId: string;
  userName: string;
  onDeleted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const members = await databases.listDocuments(DB_ID, COLLECTIONS.ORG_MEMBERS, [
        Query.equal("userId", userId),
        Query.limit(1),
      ]);
      for (const doc of members.documents) {
        await databases.deleteDocument(DB_ID, COLLECTIONS.ORG_MEMBERS, doc.$id);
      }

      const profiles = await databases.listDocuments(DB_ID, COLLECTIONS.USER_PROFILES, [
        Query.equal("userId", userId),
        Query.limit(1),
      ]);
      for (const doc of profiles.documents) {
        await databases.updateDocument(DB_ID, COLLECTIONS.USER_PROFILES, doc.$id, {
          status: "removed",
        });
      }

      toast.success(`${userName} has been removed.`);
      setOpen(false);
      onDeleted?.();
    } catch {
      toast.error("Failed to remove user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
          <Trash2Icon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Remove Member
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to remove <strong>{userName}</strong> from the organization?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? "Removing..." : "Remove"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
