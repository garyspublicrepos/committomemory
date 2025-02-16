'use client'

import { useState } from 'react'
import { format, startOfDay, endOfDay, subDays } from 'date-fns'
import { Calendar as CalendarIcon, Download, Loader2, Copy, Check, ChevronRight, Link, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getUserReflections } from '@/lib/services/reflection'
import { PushReflection } from '@/types'
import { toFrontendReflections } from '@/lib/utils'

const DEFAULT_PROMPT = `Below are my coding reflections and commit messages from a period of time. Please analyze both the reflections and the actual code changes described in commits to provide:
1. Key themes and patterns in what I've learned and worked on
2. Areas where I've shown growth based on both reflections and commit patterns
3. Technical areas I've been focusing on (based on commit messages and reflections)
4. Suggestions for areas to focus on next
5. A brief summary of the technical topics covered`

interface ShareLearningsDialogProps {
  userId: string
}

type DateRange = { from: Date; to?: Date } | undefined

export function ShareLearningsDialog({ userId }: ShareLearningsDialogProps) {
  const [open, setOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    from: startOfDay(subDays(new Date(), 7))
  }))
  const [loading, setLoading] = useState(false)
  const [exportType, setExportType] = useState<'csv' | 'summary'>('csv')
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [summary, setSummary] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleExport = async () => {
    if (!dateRange?.from) return

    setLoading(true)
    try {
      // Get start and end of the selected days
      const startDate = startOfDay(dateRange.from)
      const endDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(new Date())

      const reflections = await getUserReflections(userId)
      const frontendReflections = toFrontendReflections(reflections)
      
      // Filter reflections for the selected date range
      const filteredReflections = frontendReflections.filter(r => {
        const reflectionDate = r.createdAt
        return reflectionDate >= startDate && reflectionDate <= endDate
      })

      if (exportType === 'csv') {
        // Generate CSV
        const csvContent = generateCSV(filteredReflections)
        downloadCSV(csvContent, `learnings-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}`)
        setOpen(false)
      } else {
        // Generate summary
        const result = await generateSummary(filteredReflections, prompt)
        setSummary(result)
      }
    } catch (error) {
      console.error('Error exporting learnings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportTypeChange = (value: string) => {
    setExportType(value as 'csv' | 'summary')
    if (value === 'summary') {
      setPrompt(DEFAULT_PROMPT)
    }
    setSummary(null)
  }

  const handleCopy = async () => {
    if (summary) {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (summary && dateRange?.from && dateRange?.to) {
      const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.setAttribute('download', `learnings-summary-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}.txt`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) {
        setSummary(null)
        setCopied(false)
        setDateRange(undefined)
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Your Learnings</DialogTitle>
          <DialogDescription>
            Export your learnings for a specific date range. Choose between raw data (CSV) or an AI-generated summary.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Date Range</Label>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange?.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? format(dateRange.from, "PPP") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="single"
                    selected={dateRange?.from}
                    onSelect={(date) => setDateRange(date ? { from: date, to: dateRange?.to || date } : undefined)}
                  />
                </PopoverContent>
              </Popover>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange?.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.to ? format(dateRange.to, "PPP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="single"
                    selected={dateRange?.to}
                    onSelect={(date) => date && dateRange?.from ? setDateRange({ from: dateRange.from, to: date }) : undefined}
                    disabled={(date) => date < (dateRange?.from || new Date())}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Export Format</Label>
            <RadioGroup
              defaultValue="csv"
              onValueChange={handleExportTypeChange}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv">Raw Data (CSV)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="summary" id="summary" />
                <Label htmlFor="summary">AI Summary</Label>
              </div>
            </RadioGroup>
          </div>

          {exportType === 'summary' && !summary && (
            <div className="grid gap-2">
              <Label>
                Analysis Instructions
                <span className="text-xs text-muted-foreground ml-2">
                  Tell Gemini how to analyze your reflections
                </span>
              </Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
                placeholder="Enter your analysis instructions..."
              />
            </div>
          )}

          {summary && (
            <div className="grid gap-2">
              <Label>Generated Summary</Label>
              <div className="relative">
                <Textarea
                  value={summary}
                  readOnly
                  className="min-h-[300px] font-mono text-sm pr-12"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSummary(null)}>
                  Edit Prompt
                </Button>
                <Button onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          )}

          {!summary && (
            <Button 
              onClick={handleExport} 
              disabled={loading || !dateRange?.from}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {exportType === 'csv' ? 'Exporting...' : 'Generating...'}
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {exportType === 'csv' ? 'Export CSV' : 'Generate Summary'}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function generateCSV(reflections: PushReflection[]): string {
  const headers = [
    'Date',
    'Time',
    'Repository',
    'Total Commits',
    'Reflection',
    'Commit Details',
    'Commit Authors',
    'Commit Timestamps',
    'Commit URLs'
  ]

  const rows = reflections.map(r => {
    const date = new Date(r.createdAt)
    return [
      // Basic info
      format(date, 'yyyy-MM-dd'),
      format(date, 'HH:mm:ss'),
      r.repositoryName,
      r.commits.length.toString(),
      r.reflection,
      // Detailed commit info
      r.commits.map(c => `${c.id.substring(0, 7)}: ${c.message}`).join('\n'),
      r.commits.map(c => `${c.author.name} <${c.author.email}>`).join('\n'),
      r.commits.map(c => format(new Date(c.timestamp), 'yyyy-MM-dd HH:mm:ss')).join('\n'),
      r.commits.map(c => c.url).join('\n')
    ]
  })

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      // Replace newlines with semicolons for better readability in Excel
      const processedCell = cell.replace(/\n/g, '; ')
      // Escape quotes and wrap in quotes
      return `"${processedCell.replace(/"/g, '""')}"`
    }).join(','))
  ].join('\n')
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

async function generateSummary(reflections: PushReflection[], promptTemplate: string): Promise<string> {
  // Format reflections into a readable text that includes commit details
  const formattedReflections = reflections.map(r => {
    const commitDetails = r.commits.map(c => 
      `  - ${c.message} (${c.id.substring(0, 7)})`
    ).join('\n')

    return `
Date: ${format(new Date(r.createdAt), 'PPP')}
Repository: ${r.repositoryName}

Commits:
${commitDetails}

Your Reflection:
${r.reflection || 'No reflection written'}
    `
  }).join('\n---\n')

  const response = await fetch('/api/summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      reflections: formattedReflections,
      prompt: promptTemplate
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to generate summary')
  }

  const { summary } = await response.json()
  return summary
} 