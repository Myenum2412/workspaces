"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const STORAGE_KEY = "repeated-task-days"

export function RepeatedSettings() {
  const [days, setDays] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setDays(JSON.parse(saved))
  }, [])

  function toggleDay(day: string) {
    setDays((prev) => {
      const next = prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Repeated Task Days</CardTitle>
        <CardDescription>
          Select which days of the week repeated tasks should be created on.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          {DAYS.map((day) => (
            <div key={day} className="flex items-center gap-2">
              <Switch
                id={`day-${day}`}
                checked={days.includes(day)}
                onCheckedChange={() => toggleDay(day)}
              />
              <Label htmlFor={`day-${day}`}>{day}</Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
