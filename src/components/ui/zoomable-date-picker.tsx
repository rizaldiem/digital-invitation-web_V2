"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/index"

interface ZoomableDatePickerProps {
  value: string
  onChange: (value: string) => void
}

type ViewMode = "date" | "month" | "year"

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export function ZoomableDatePicker({ value, onChange }: ZoomableDatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  )
  const [viewMode, setViewMode] = React.useState<ViewMode>("date")
  const [displayYear, setDisplayYear] = React.useState(date?.getFullYear() || new Date().getFullYear())

  React.useEffect(() => {
    if (value) {
      const parsed = new Date(value)
      setDate(parsed)
      setDisplayYear(parsed.getFullYear())
    }
  }, [value])

  const handleDateSelect = (selectedDate: Date) => {
    setDate(selectedDate)
    onChange(format(selectedDate, "yyyy-MM-dd"))
  }

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(displayYear, monthIndex, 1)
    setDate(newDate)
    setViewMode("date")
  }

  const handleYearSelect = (year: number) => {
    setDisplayYear(year)
    setViewMode("month")
  }

  const handleDateHeaderClick = () => {
    setViewMode("month")
  }

  const handleMonthHeaderClick = () => {
    setViewMode("year")
  }

  const navigateYears = (direction: number) => {
    setDisplayYear(prev => prev + direction * 10)
  }

  const yearRangeStart = Math.floor(displayYear / 10) * 10
  const yearRange = Array.from({ length: 10 }, (_, i) => yearRangeStart + i)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={"w-full justify-start text-left font-normal"}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="w-[280px]">
          {viewMode === "date" && (
            <DateView
              date={date}
              onSelect={handleDateSelect}
              onHeaderClick={handleDateHeaderClick}
            />
          )}
          {viewMode === "month" && (
            <MonthView
              year={displayYear}
              selectedMonth={date?.getMonth()}
              onMonthSelect={handleMonthSelect}
              onHeaderClick={handleMonthHeaderClick}
              onBack={() => setViewMode("date")}
            />
          )}
          {viewMode === "year" && (
            <YearView
              yearRange={yearRange}
              selectedYear={date?.getFullYear()}
              onYearSelect={handleYearSelect}
              onNavigate={navigateYears}
              onBack={() => setViewMode("month")}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function DateView({
  date,
  onSelect,
  onHeaderClick
}: {
  date?: Date
  onSelect: (date: Date) => void
  onHeaderClick: () => void
}) {
  const [currentMonth, setCurrentMonth] = React.useState(date || new Date())

  const days = React.useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay()
    const totalDays = lastDay.getDate()
    
    const result: (Date | null)[] = []
    
    for (let i = 0; i < startPadding; i++) {
      result.push(null)
    }
    
    for (let i = 1; i <= totalDays; i++) {
      result.push(new Date(year, month, i))
    }
    
    return result
  }, [currentMonth])

  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <button
          onClick={onHeaderClick}
          className="text-sm font-medium hover:underline cursor-pointer"
        >
          {format(currentMonth, "MMMM yyyy")}
        </button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs text-muted-foreground py-1">
            {day}
          </div>
        ))}
        {days.map((day, i) => (
          <button
            key={i}
            disabled={!day}
            onClick={() => day && onSelect(day)}
            className={cn(
              "h-8 w-8 text-sm rounded-md hover:bg-accent",
              !day && "invisible",
              day && date && day.toDateString() === date.toDateString() && "bg-primary text-primary-foreground",
              day && (!date || day.toDateString() !== date.toDateString()) && "text-foreground"
            )}
          >
            {day?.getDate()}
          </button>
        ))}
      </div>
    </div>
  )
}

function MonthView({
  year,
  selectedMonth,
  onMonthSelect,
  onHeaderClick,
  onBack
}: {
  year: number
  selectedMonth?: number
  onMonthSelect: (month: number) => void
  onHeaderClick: () => void
  onBack: () => void
}) {
  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <button
          onClick={onHeaderClick}
          className="text-sm font-medium hover:underline cursor-pointer"
        >
          {year}
        </button>
        <div className="w-7" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {months.map((month, index) => (
          <button
            key={month}
            onClick={() => onMonthSelect(index)}
            className={cn(
              "h-9 text-sm rounded-md hover:bg-accent",
              selectedMonth === index && "bg-primary text-primary-foreground"
            )}
          >
            {month.slice(0, 3)}
          </button>
        ))}
      </div>
    </div>
  )
}

function YearView({
  yearRange,
  selectedYear,
  onYearSelect,
  onNavigate,
  onBack
}: {
  yearRange: number[]
  selectedYear?: number
  onYearSelect: (year: number) => void
  onNavigate: (dir: number) => void
  onBack: () => void
}) {
  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onNavigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {yearRange[0]} - {yearRange[yearRange.length - 1]}
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onNavigate(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="w-7" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {yearRange.map(year => (
          <button
            key={year}
            onClick={() => onYearSelect(year)}
            className={cn(
              "h-9 text-sm rounded-md hover:bg-accent",
              selectedYear === year && "bg-primary text-primary-foreground"
            )}
          >
            {year}
          </button>
        ))}
      </div>
    </div>
  )
}
