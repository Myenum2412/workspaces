"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useOnClickOutside } from "usehooks-ts";
import { cn } from "@/lib/utils";

export type BasicModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  zIndex?: {
    backdrop?: string;
    modal?: string;
  };
  preventClose?: boolean;
  className?: string;
};

const modalSizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-5xl",
  full: "max-w-7xl ",
};

export function BasicModal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  zIndex,
  preventClose = false,
  className,
}: BasicModalProps) {
  const backdropZIndex = zIndex?.backdrop || "z-[80]";
  const modalZIndex = zIndex?.modal || "z-[90]";
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;

  // Prevent click-outside from triggering immediately when modal opens
  const [isClickOutsideEnabled, setIsClickOutsideEnabled] = useState(false);

  // Enable click-outside handler after a short delay when modal opens
  useEffect(() => {
    if (isOpen) {
      // Delay to prevent the opening click from closing the modal
      const timer = setTimeout(() => {
        setIsClickOutsideEnabled(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsClickOutsideEnabled(false);
    }
  }, [isOpen]);

  // Custom click outside handler that ignores Select dropdowns and Popovers
  useOnClickOutside(modalRef, (event) => {
    // Don't close if click-outside is not yet enabled
    if (!isClickOutsideEnabled) return;

    // Check if the click is on a Select dropdown or Popover (which are portaled)
    const target = event.target as HTMLElement;

    // Fix for Radix UI Select components: 
    // When clicking an option, it is immediately removed from the DOM.
    // If the target is no longer attached to the document, ignore the click outside.
    if (!document.contains(target)) {
      return;
    }

    // Check for Radix UI Select dropdown - SelectContent uses data-slot="select-content"
    const isSelectDropdown =
      target.closest('[data-slot="select-content"]') ||
      target.closest('[data-slot="select-item"]') ||
      target.closest('[data-slot="select-trigger"]') ||
      target.closest('[data-radix-popper-content-wrapper]') ||
      target.closest('[role="listbox"]') ||
      // Check if click is on any element with radix-select attributes
      target.hasAttribute('data-slot') && target.getAttribute('data-slot')?.includes('select');

    const isPopover =
      target.closest('[data-slot="popover-content"]') ||
      target.closest('[role="dialog"]') ||
      target.closest('[data-radix-popover-content]');

    // Check for Calendar / date picker portaled elements
    const isCalendar =
      target.closest('[role="grid"]') ||
      target.closest('[data-slot="calendar"]') ||
      target.closest('.rdp') ||
      target.closest('[role="gridcell"]');

    // Check for toast notifications
    const isToast =
      target.closest('[data-sonner-toast]') ||
      target.closest('[data-sonner-toaster]');

    // Only close if not clicking on a portaled element
    if (!isSelectDropdown && !isPopover && !isCalendar && !isToast) {
      onClose();
    }
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key press
  useEffect(() => {
    if (preventClose) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, preventClose]);

  // Note: Body scroll locking is handled by the overlay and modal positioning
  // No need to manually set body overflow as it can conflict with other components

  if (!mounted || !isOpen) {
    return null;
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 ${backdropZIndex} bg-secondary/70`}
        onClick={() => {
          // Backdrop click is handled by useOnClickOutside hook
          // No-op here to prevent double-close
        }}
        ref={overlayRef}
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 ${modalZIndex} flex items-center justify-center overflow-y-auto px-4 py-6 sm:p-0`}
      >
        <div
          className={cn(`${modalSizes[size]} relative mx-auto w-full rounded-xl border bg-card p-4  sm:p-6`, className)}
          ref={modalRef}
        >
          {/* Header */}
          <div className="mb-4 flex items-center justify-between border-b pb-3">
            {title && (
              <h3 className="font-medium text-xl leading-6 text-center w-full">{title}</h3>
            )}
            <button
              className="ml-auto rounded-full p-1.5 transition-colors hover:bg-secondary z-50"
              onClick={onClose}
            >
              <X className="h-5 w-5 z-50 text-red-500" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          {/* Content */}
          <div className="relative flex-1 flex flex-col min-h-0 h-full">{children}</div>
        </div>
      </div>
    </>,
    document.body
  );
}
