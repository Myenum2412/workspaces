'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  formatBytes,
  useFileUpload,
  type FileMetadata,
  type FileWithPreview,
} from '@/hooks/use-file-upload';
import { Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  CloudUpload,
  Download,
  FileArchiveIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  HeadphonesIcon,
  ImageIcon,
  RefreshCwIcon,
  Trash2,
  TriangleAlert,
  Upload,
  VideoIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadItem extends FileWithPreview {
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

interface TableUploadProps {
  maxFiles?: number;
  maxSize?: number;
  accept?: string;
  multiple?: boolean;
  className?: string;
  onFilesChange?: (files: FileWithPreview[]) => void;
  simulateUpload?: boolean;
  compactImage?: boolean;
}

export default function TableUpload({
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  accept = '*',
  multiple = true,
  className,
  onFilesChange,
  simulateUpload = true,
  compactImage = false,
}: TableUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<FileUploadItem[]>([]);

  const [
    { isDragging, errors },
    {
      removeFile,
      clearFiles,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles,
    maxSize,
    accept,
    multiple,
    initialFiles: [],
    onFilesChange: (newFiles) => {
      // Convert to upload items when files change, preserving existing status
      const newUploadFiles = newFiles.map((file) => {
        // Check if this file already exists in uploadFiles
        const existingFile = uploadFiles.find((existing) => existing.id === file.id);

        if (existingFile) {
          // Preserve existing file status and progress
          return {
            ...existingFile,
            ...file, // Update any changed properties from the file
          };
        } else {
          // New file - set to uploading
          return {
            ...file,
            progress: 0,
            status: 'uploading' as const,
          };
        }
      });
      setUploadFiles(newUploadFiles);
      onFilesChange?.(newFiles);
    },
  });

  // Simulate upload progress
  useEffect(() => {
    if (!simulateUpload) return;

    const interval = setInterval(() => {
      setUploadFiles((prev) =>
        prev.map((file) => {
          if (file.status !== 'uploading') return file;

          const increment = Math.random() * 15 + 5; // 5-20% increment
          const newProgress = Math.min(file.progress + increment, 100);

          if (newProgress >= 100) {
            // Randomly decide if upload succeeds or fails
            const shouldFail = Math.random() < 0.1; // 10% chance to fail
            return {
              ...file,
              progress: 100,
              status: shouldFail ? ('error' as const) : ('completed' as const),
              error: shouldFail ? 'Upload failed. Please try again.' : undefined,
            };
          }

          return { ...file, progress: newProgress };
        }),
      );
    }, 500);

    return () => clearInterval(interval);
  }, [simulateUpload]);

  const removeUploadFile = (fileId: string) => {
    setUploadFiles((prev) => prev.filter((file) => file.id !== fileId));
    removeFile(fileId);
  };

  const retryUpload = (fileId: string) => {
    setUploadFiles((prev) =>
      prev.map((file) =>
        file.id === fileId ? { ...file, progress: 0, status: 'uploading' as const, error: undefined } : file,
      ),
    );
  };

  const handleClearFiles = () => {
    setUploadFiles([]);
    clearFiles();
  };

  const getFileIcon = (file: File | FileMetadata) => {
    const type = file instanceof File ? file.type : file.type;
    if (type.startsWith('image/')) return <ImageIcon className="size-4" />;
    if (type.startsWith('video/')) return <VideoIcon className="size-4" />;
    if (type.startsWith('audio/')) return <HeadphonesIcon className="size-4" />;
    if (type.includes('pdf')) return <FileTextIcon className="size-4" />;
    if (type.includes('word') || type.includes('doc')) return <FileTextIcon className="size-4" />;
    if (type.includes('excel') || type.includes('sheet')) return <FileSpreadsheetIcon className="size-4" />;
    if (type.includes('zip') || type.includes('rar')) return <FileArchiveIcon className="size-4" />;
    return <FileTextIcon className="size-4" />;
  };

  const getFileTypeLabel = (file: File | FileMetadata) => {
    const type = file instanceof File ? file.type : file.type;
    if (type.startsWith('image/')) return 'Image';
    if (type.startsWith('video/')) return 'Video';
    if (type.startsWith('audio/')) return 'Audio';
    if (type.includes('pdf')) return 'PDF';
    if (type.includes('word') || type.includes('doc')) return 'Word';
    if (type.includes('excel') || type.includes('sheet')) return 'Excel';
    if (type.includes('zip') || type.includes('rar')) return 'Archive';
    if (type.includes('json')) return 'JSON';
    if (type.includes('text')) return 'Text';
    return 'File';
  };


  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | 'type' | 'size'
    direction: 'asc' | 'desc' | null
  }>({ key: 'name', direction: 'asc' })

  const handleSort = (key: 'name' | 'type' | 'size') => {
    let direction: 'asc' | 'desc' | null = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null
    }
    setSortConfig({ key, direction })
  }

  const sortedFiles = useMemo(() => [...uploadFiles].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0
    
    let comparison = 0

    if (sortConfig.key === 'name') {
      comparison = a.file.name.localeCompare(b.file.name, undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    } else if (sortConfig.key === 'type') {
      comparison = getFileTypeLabel(a.file).localeCompare(getFileTypeLabel(b.file), undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    } else if (sortConfig.key === 'size') {
      comparison = a.file.size - b.file.size
    }

    return sortConfig.direction === 'asc' ? comparison : -comparison
  }), [sortConfig.direction, sortConfig.key, uploadFiles])

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Upload Area */}
      <div
        className={cn(
          'relative rounded-lg border border-dashed p-6 text-center transition-colors',
          compactImage && 'p-3',
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50',
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input {...getInputProps()} className="sr-only" />

        {uploadFiles.length === 0 && (
          <div className={cn(
            'relative cursor-pointer flex flex-col items-center justify-center p-6 gap-4',
            compactImage && 'p-2 gap-2'
          )} onClick={openFileDialog}>
            <div className={cn(
              "flex flex-col items-center gap-2 text-center",
              compactImage && "gap-1"
            )}>
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full bg-muted transition-colors',
                  compactImage && "h-8 w-8",
                  isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25',
                )}
              >
                <Upload className={cn("h-5 w-5 text-muted-foreground", compactImage && "h-4 w-4")} />
              </div>

              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  Drop files here or{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent parent div's onClick from firing
                      openFileDialog();
                    }}
                    className="cursor-pointer text-primary underline-offset-4 hover:underline"
                  >
                    browse files
                  </button>
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Max: {formatBytes(maxSize)} • {maxFiles} files
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Files Table */}
        {uploadFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Files ({uploadFiles.length})</h3>
              <div className="flex gap-2">
                <Button type="button" onClick={openFileDialog} variant="outline" size="sm">
                  <CloudUpload className="mr-2 size-4" />
                  Add files
                </Button>
                <Button type="button" onClick={handleClearFiles} variant="outline" size="sm">
                  <Trash2 className="mr-2 size-4" />
                  Remove all
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border bg-background text-left scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead 
                      className={cn("h-9 cursor-pointer hover:bg-muted transition-colors", compactImage && "h-7")}
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Name
                        {sortConfig.key === 'name' && (
                          sortConfig.direction === 'asc' ? <RefreshCwIcon className="size-3 rotate-0 transition-transform" /> : <RefreshCwIcon className="size-3 rotate-180 transition-transform" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className={cn("h-9 cursor-pointer hover:bg-muted transition-colors", compactImage && "h-7")}
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center gap-1">
                        Type
                        {sortConfig.key === 'type' && (
                          sortConfig.direction === 'asc' ? <RefreshCwIcon className="size-3 rotate-0" /> : <RefreshCwIcon className="size-3 rotate-180" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className={cn("h-9 cursor-pointer hover:bg-muted transition-colors", compactImage && "h-7")}
                      onClick={() => handleSort('size')}
                    >
                      <div className="flex items-center gap-1">
                        Size
                        {sortConfig.key === 'size' && (
                          sortConfig.direction === 'asc' ? <RefreshCwIcon className="size-3 rotate-0" /> : <RefreshCwIcon className="size-3 rotate-180" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className={cn("h-9 w-[100px] text-end", compactImage && "h-7")}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedFiles.map((fileItem) => (
                    <TableRow key={fileItem.id}>
                      <TableCell className="py-2 ps-1.5">
                        <div className="flex items-center gap-1">
                          <div
                            className={cn(
                              'size-8 shrink-0 relative flex items-center justify-center text-muted-foreground/80',
                            )}
                          >
                            {fileItem.status === 'uploading' ? (
                              <div className="relative">
                                {/* Circular progress background */}
                                <svg className="size-8 -rotate-90" viewBox="0 0 32 32">
                                  <circle
                                    cx="16"
                                    cy="16"
                                    r="14"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="text-muted-foreground/20"
                                  />
                                  {/* Progress circle */}
                                  <circle
                                    cx="16"
                                    cy="16"
                                    r="14"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeDasharray={`${2 * Math.PI * 14}`}
                                    strokeDashoffset={`${2 * Math.PI * 14 * (1 - fileItem.progress / 100)}`}
                                    className="text-primary transition-all duration-300"
                                    strokeLinecap="round"
                                    role="progressbar"
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={Math.round(fileItem.progress)}
                                    aria-label={`Upload progress for ${fileItem.file.name}`}
                                  />
                                </svg>
                                {/* File icon in center */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  {getFileIcon(fileItem.file)}
                                </div>
                              </div>
                            ) : (
                              <div className="not-[]:size-8 flex items-center justify-center">
                                {getFileIcon(fileItem.file)}
                              </div>
                            )}
                          </div>
                          <p className="flex items-center gap-1 truncate text-sm font-medium">
                            {fileItem.file.name}
                            {fileItem.status === 'error' && (
                              <Badge variant="destructive" className="text-xs">
                                Error
                              </Badge>
                            )}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant="secondary" className="text-xs">
                          {getFileTypeLabel(fileItem.file)}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn("py-2 text-sm text-muted-foreground", compactImage && "py-1")}>
                        {formatBytes(fileItem.file.size)}
                      </TableCell>
                      <TableCell className={cn("py-2 pe-1", compactImage && "py-1")}>
                        <div className="flex items-center gap-1">
                          {fileItem.preview && (
                            <Button size="icon" className="size-8" asChild>
                              <Link
                                href={fileItem.preview}
                                target="_blank"
                                aria-label={`Open preview for ${fileItem.file.name}`}
                              >
                                <Download className="size-3.5" />
                              </Link>
                            </Button>
                          )}
                          {fileItem.status === 'error' ? (
                            <Button
                              onClick={() => retryUpload(fileItem.id)}
                              variant="outline"
                              size="icon"
                              aria-label={`Retry upload for ${fileItem.file.name}`}
                              className="size-8 text-destructive/80 hover:text-destructive"
                            >
                              <RefreshCwIcon className="size-3.5" />
                            </Button>
                          ) : (
                            <Button
                              onClick={() => removeUploadFile(fileItem.id)}
                              variant="outline"
                              size="icon"
                              aria-label={`Remove ${fileItem.file.name}`}
                              className="size-8"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {errors.length > 0 && (
          <Alert variant="destructive" appearance="light" className="mt-5">
            <AlertIcon>
              <TriangleAlert />
            </AlertIcon>
            <AlertContent>
              <AlertTitle>File upload error(s)</AlertTitle>
              <AlertDescription>
                {errors.map((error, index) => (
                  <p key={index} className="last:mb-0">
                    {error}
                  </p>
                ))}
              </AlertDescription>
            </AlertContent>
          </Alert>
        )}
      </div>
    </div>
  );
}
