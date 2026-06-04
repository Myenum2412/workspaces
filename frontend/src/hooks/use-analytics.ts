"use client"

type TrackEvent = (name: string, data?: Record<string, unknown>) => void
type TrackInteraction = (element: string, action: string, data?: Record<string, unknown>) => void

export function useAnalytics(_pageName: string) {
  const trackEvent: TrackEvent = (name, data) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[analytics] ${_pageName}: ${name}`, data)
    }
  }

  const trackInteraction: TrackInteraction = (element, action, data) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[analytics] ${_pageName}: ${element} ${action}`, data)
    }
  }

  return { trackEvent, trackInteraction }
}
