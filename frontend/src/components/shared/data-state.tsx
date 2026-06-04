"use client";

import React, { ReactNode } from "react";

interface DataStateProps {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode;
  emptyComponent?: ReactNode;
  children: ReactNode;
  error?: Error | null;
}

export function DataState({
  isLoading,
  isError,
  isEmpty,
  loadingComponent,
  errorComponent,
  emptyComponent,
  children,
  error,
}: DataStateProps) {
  if (isLoading) {
    return loadingComponent ? <>{loadingComponent}</> : <DefaultLoading />;
  }

  if (isError) {
    return errorComponent ? <>{errorComponent}</> : <DefaultError error={error} />;
  }

  if (isEmpty) {
    return emptyComponent ? <>{emptyComponent}</> : <DefaultEmpty />;
  }

  return <>{children}</>;
}

function DefaultLoading() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function DefaultError({ error }: { error?: Error | null }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
        <svg
          className="h-6 w-6 text-red-600 dark:text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <p className="text-sm font-medium">Failed to load data</p>
      {error?.message && (
        <p className="max-w-sm text-xs text-muted-foreground">{error.message}</p>
      )}
    </div>
  );
}

function DefaultEmpty() {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="rounded-full bg-muted p-3">
        <svg
          className="h-6 w-6 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <p className="text-sm font-medium">No data found</p>
      <p className="max-w-sm text-xs text-muted-foreground">
        There are no items to display yet.
      </p>
    </div>
  );
}
