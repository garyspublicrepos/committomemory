'use client'

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Brain, Sparkles, ArrowRight, Share2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function Home() {
  const router = useRouter()

  return (
    <main className="min-h-screen flex flex-col items-center px-4">
      {/* Hero Section */}
      <div className="w-full max-w-5xl mx-auto py-24 text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent pb-3">
          Turn Every Git Push into Shared Knowledge
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
          Build a culture of continuous learning. Transform individual code pushes into collective team knowledge.
        </p>
        <Button 
          size="lg" 
          onClick={() => router.push('/setup')}
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
        >
          Start Your Learning Journey
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>

      {/* Value Props */}
      <div className="w-full max-w-5xl mx-auto pb-24 grid md:grid-cols-3 gap-8 px-4">
        <Card className="bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
          <CardContent className="pt-6">
            <div className="rounded-full w-12 h-12 bg-purple-500/10 flex items-center justify-center mb-4">
              <Share2 className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-purple-400">
              Share Team Insights
            </h3>
            <p className="text-muted-foreground">
              Turn personal learnings into organizational knowledge. Help your team grow together through shared experiences.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
          <CardContent className="pt-6">
            <div className="rounded-full w-12 h-12 bg-blue-500/10 flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-blue-400">
              Mindful Development
            </h3>
            <p className="text-muted-foreground">
              Break free from autopilot coding. Create a space for your team to reflect and learn from each push.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="rounded-full w-12 h-12 bg-emerald-500/10 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-emerald-400">
              Collective Growth
            </h3>
            <p className="text-muted-foreground">
              Build a rich knowledge base that elevates your entire team. Learn from each other&apos;s experiences and insights.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom CTA */}
      <div className="w-full bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 py-24">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-6">
            Elevate Your Team&apos;s Learning Culture
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            In today&apos;s fast-paced tech world, individual growth isn&apos;t enough. PushToMemory helps your 
            team build a shared knowledge base, turning every developer&apos;s insights into collective wisdom 
            that drives your organization forward.
          </p>
          <Button 
            size="lg" 
            onClick={() => router.push('/setup')}
            variant="outline"
            className="border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/10"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </main>
  )
}
