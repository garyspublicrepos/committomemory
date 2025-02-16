'use client'

import { useState } from 'react'
import { format, startOfDay, endOfDay, subDays } from 'date-fns'
import { Calendar as CalendarIcon, Download, Loader2, Copy, Check, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { getUserReflections } from '@/lib/services/reflection'
import { PushReflection } from '@/types'
import { toFrontendReflections } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const DEFAULT_PROMPT = `Below are my coding reflections and commit messages from a period of time. Please analyze both the reflections and the actual code changes described in commits to provide:
1. Key themes and patterns in what I've learned and worked on
2. Areas where I've shown growth based on both reflections and commit patterns
3. Technical areas I've been focusing on (based on commit messages and reflections)
4. Suggestions for areas to focus on next
5. A brief summary of the technical topics covered`

type DateRange = { from: Date; to?: Date } | undefined

export default function ReflectPage() {
  const { user } = useAuth()
  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    from: startOfDay(subDays(new Date(), 7))
  }))
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [summary, setSummary] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [reflections, setReflections] = useState<PushReflection[]>([])

  const handleGenerateSummary = async () => {
    if (!dateRange?.from || !user) return

    setLoading(true)
    try {
      // Get start and end of the selected days
      const startDate = startOfDay(dateRange.from)
      const endDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(new Date())

      const reflectionsData = await getUserReflections(user.uid)
      const frontendReflections = toFrontendReflections(reflectionsData)
      
      // Filter reflections for the selected date range
      const filteredReflections = frontendReflections.filter(r => {
        const reflectionDate = r.createdAt
        return reflectionDate >= startDate && reflectionDate <= endDate
      })

      setReflections(filteredReflections)

      // Generate summary
      const result = await generateSummary(filteredReflections, prompt)
      setSummary(result)
    } catch (error) {
      console.error('Error generating summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (summary) {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (summary && dateRange?.from) {
      const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.setAttribute('download', `learnings-summary-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to || new Date(), 'yyyy-MM-dd')}.txt`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Not Authorized</CardTitle>
          <CardDescription>Please sign in to view your reflections.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <main className="container max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-8">Reflect on Your Learning Journey</h1>
      
      <div className="grid gap-8">
        {/* Date Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Time Period</CardTitle>
            <CardDescription>Choose a date range to analyze your reflections</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Analysis Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Instructions</CardTitle>
            <CardDescription>Customize how you want your reflections to be analyzed</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
              placeholder="Enter your analysis instructions..."
            />
          </CardContent>
        </Card>

        {/* Generate Button */}
        <Button 
          onClick={handleGenerateSummary} 
          disabled={loading || !dateRange?.from}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Reflections...
            </>
          ) : (
            'Generate Learning Summary'
          )}
        </Button>

        {/* Results */}
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Learning Summary
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Analysis of {reflections.length} reflection{reflections.length === 1 ? '' : 's'} from {dateRange?.from ? format(dateRange.from, 'PPP') : ''} to {dateRange?.to ? format(dateRange.to, 'PPP') : 'today'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4">
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {summary}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}

async function generateSummary(reflections: PushReflection[], promptTemplate: string): Promise<string> {
  // Format reflections into a readable text that includes commit details
  const formattedReflections = reflections.map(r => {
    const commitDetails = r.commits.map(c => 
      `  - ${c.message} (${c.id.substring(0, 7)})`
    ).join('\n')

    // Get the author from the first commit
    const author = r.commits[0].author

    return `
Date: ${format(new Date(r.createdAt), 'PPP')}
Author: ${author.name} <${author.email}>
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