"use client"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock } from "lucide-react"

interface TimeRangePickerProps {
  value: string
  onChange: (value: string) => void
}

const timeOptions = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30",
  "22:00"
]

function parseTimeRange(value: string): { start: string; end: string } {
  if (!value) return { start: "", end: "" }
  
  const match = value.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/)
  if (match) {
    return { start: match[1], end: match[2] }
  }
  
  return { start: "", end: "" }
}

export function TimeRangePicker({ value, onChange }: TimeRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [startTime, setStartTime] = React.useState("")
  const [endTime, setEndTime] = React.useState("")

  React.useEffect(() => {
    const { start, end } = parseTimeRange(value)
    setStartTime(start)
    setEndTime(end)
  }, [value])

  const handleApply = () => {
    if (startTime && endTime) {
      onChange(`${startTime} - ${endTime} WIB`)
    }
    setOpen(false)
  }

  const displayValue = value || "Select time range"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={"w-full justify-start text-left font-normal"}
        >
          <Clock className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Start Time</Label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            >
              <option value="">Select start time</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>End Time</Label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            >
              <option value="">Select end time</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
