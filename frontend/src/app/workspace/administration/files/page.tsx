"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatBytes } from "@/hooks/use-file-upload";
import { filesApi } from "@/lib/api/client";
import { SectionPage } from "../../section-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  FilesIcon,
  Search,
  Trash2,
  Download,
  Upload,
  FolderOpen,
  FileTextIcon,
  FileSpreadsheetIcon,
  ImageIcon,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function getFileIcon(mimetype: string) {
  if (mimetype?.startsWith("image/")) return <ImageIcon className="size-4" />;
  if (mimetype?.includes("spreadsheet") || mimetype?.includes("excel"))
    return <FileSpreadsheetIcon className="size-4" />;
  if (mimetype?.includes("pdf") || mimetype?.includes("word") || mimetype?.includes("document"))
    return <FileTextIcon className="size-4" />;
  return <FileTextIcon className="size-4" />;
}

function getFileTypeLabel(mimetype: string) {
  if (mimetype?.startsWith("image/")) return "Image";
  if (mimetype?.startsWith("video/")) return "Video";
  if (mimetype?.includes("pdf")) return "PDF";
  if (mimetype?.includes("word") || mimetype?.includes("document")) return "Word";
  if (mimetype?.includes("spreadsheet") || mimetype?.includes("excel")) return "Excel";
  if (mimetype?.includes("zip")) return "Archive";
  return "File";
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function FilesManagementPage() {
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  const { data: foldersRes, isLoading: foldersLoading } = useQuery({
    queryKey: ["workspace", "files", "folders"],
    queryFn: filesApi.listFolders,
  });

  const folders = foldersRes?.folders || [];

  // Auto-select first folder on load
  const activeFolder = selectedFolder || (folders.length > 0 ? folders[0] : "");

  const { data: filesRes, isLoading: filesLoading, refetch: refetchFiles } = useQuery({
    queryKey: ["workspace", "files", "list", activeFolder, page],
    queryFn: () =>
      filesApi.list({
        folder: activeFolder,
        page,
        limit: 20,
      }),
    enabled: !!activeFolder,
  });

  const allFiles = filesRes?.files || [];
  const totalFiles = filesRes?.total || 0
  const totalPages = filesRes?.pages || 1;

  const filteredFiles = search
    ? allFiles.filter((f: any) =>
        f.originalName?.toLowerCase().includes(search.toLowerCase()),
      )
    : allFiles;

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        await filesApi.uploadAndRecord(file);
        toast.success(`"${file.name}" uploaded`);
        queryClient.invalidateQueries({ queryKey: ["workspace", "files"] });
        setUploadDialogOpen(false);
      } catch (err: any) {
        toast.error(err.message || "Upload failed");
      } finally {
        setUploading(false);
        // Reset input
        e.target.value = "";
      }
    },
    [queryClient],
  );

  const handleDelete = useCallback(
    async (file: any) => {
      if (!confirm(`Delete "${file.originalName}"?`)) return;
      try {
        await filesApi.delete(file._id);
        toast.success(`"${file.originalName}" deleted`);
        queryClient.invalidateQueries({ queryKey: ["workspace", "files"] });
      } catch (err: any) {
        toast.error(err.message || "Delete failed");
      }
    },
    [queryClient],
  );

  return (
    <SectionPage
      title="File Management"
      description="Browse and manage uploaded files organized by folder."
    >
      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mb-4">
            <Upload className="mr-2 size-4" />
            Upload File
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-500">
              Upload will be placed in the <strong>{activeFolder || "files"}</strong> folder.
              Max file size: 25MB. Allowed: PDF, Word, Excel, PowerPoint, CSV, TXT, ZIP, JSON.
            </p>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip,.json"
                onChange={handleUpload}
                disabled={uploading}
              />
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-muted-500">
                  <Loader2 className="size-4 animate-spin" />
                  Uploading...
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex gap-6">
        {/* Folder Sidebar */}
        <div className="w-48 shrink-0">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-500 mb-3">
            Folders
          </h3>
          {foldersLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-500 p-2">
              <Loader2 className="size-3 animate-spin" />
              Loading...
            </div>
          ) : folders.length === 0 ? (
            <p className="text-xs text-muted-400 p-2">No folders yet</p>
          ) : (
            <div className="space-y-1">
              {folders.map((folder: string) => (
                <button
                  key={folder}
                  onClick={() => {
                    setSelectedFolder(folder);
                    setPage(1);
                  }}
                  className={cn(
                    "flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                    activeFolder === folder
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted text-muted-700",
                  )}
                >
                  <FolderOpen className="size-4 shrink-0" />
                  <span className="truncate">{folder}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {activeFolder ? (
            <>
              {/* Search + Controls */}
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-500" />
                  <Input
                    placeholder="Search files..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchFiles()}>
                  <RefreshCw className="mr-2 size-3.5" />
                  Refresh
                </Button>
              </div>

              {/* Files Table */}
              {filesLoading ? (
                <div className="flex items-center justify-center py-20 text-muted-500">
                  <Loader2 className="size-6 animate-spin mr-2" />
                  Loading files...
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-500 border-2 border-dashed rounded-lg">
                  <FilesIcon className="size-12 mb-3 text-muted-300" />
                  <p className="text-sm font-medium">
                    {search ? "No files match your search" : "No files in this folder"}
                  </p>
                  <p className="text-xs text-muted-400 mt-1">
                    {search ? "Try a different search term" : "Upload files to get started"}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Uploaded By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFiles.map((file: any) => (
                        <TableRow key={file._id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getFileIcon(file.mimetype)}
                              <span className="truncate text-sm font-medium max-w-[250px]">
                                {file.originalName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {getFileTypeLabel(file.mimetype)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-500">
                            {formatBytes(file.size)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-500">
                            {file.userName || "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-500">
                            {formatDate(file.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {file.url && (
                                <Button size="icon" variant="ghost" className="size-8" asChild>
                                  <Link href={file.url} target="_blank" rel="noopener noreferrer">
                                    <Download className="size-3.5" />
                                  </Link>
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 text-destructive/70 hover:text-destructive"
                                onClick={() => handleDelete(file)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {totalFiles > 0 && (
                <div className="flex items-center justify-between mt-4 px-1">
                  <p className="text-xs text-muted-500">
                    {filteredFiles.length} of {totalFiles} file{totalFiles !== 1 ? "s" : ""}
                    {search && " (filtered)"}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-xs text-muted-500">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-muted-500">
              <FolderOpen className="size-12 mb-3 text-muted-300" />
              <p className="text-sm font-medium">No folders yet</p>
              <p className="text-xs text-muted-400 mt-1">
                Upload a file to create the first folder
              </p>
            </div>
          )}
        </div>
      </div>
    </SectionPage>
  );
}
