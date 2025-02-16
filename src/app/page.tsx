'use client'

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Brain, Sparkles, ArrowRight, Share2, GitCommit, Clock, Users, Rocket, Bot, Heart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

export default function Home() {
  const router = useRouter()

  return (
    <main className="min-h-screen flex flex-col items-center px-4">
      {/* Hero Section */}
      <div className="w-full max-w-5xl mx-auto py-24 text-center space-y-6">
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="PushToMemory Logo" width={96} height={96} className="rounded-full" />
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent pb-3">
          Turn Every Git Push into Shared Knowledge
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
          In an age where AI makes it easy to generate code without understanding it, we need to be more intentional about learning.
        </p>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
          Build a culture of conscious development. Transform every code push into an opportunity for deeper understanding.
        </p>
        <Button 
          size="lg" 
          onClick={() => router.push('/setup')}
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-base md:text-2xl h-12 md:h-16 px-6 md:px-12"
        >
          Build A Learning Organization 📚
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

      {/* Q&A Section */}
      <div className="w-full bg-gradient-to-br from-amber-50 via-yellow-50/90 to-orange-50 py-24">
        <div className="w-full max-w-4xl mx-auto px-4 space-y-12">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Common Questions
          </h2>

          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-purple-700 flex items-center gap-2">
                <GitCommit className="h-5 w-5" />
                Why not just add learning notes to Git commit messages?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Commit messages should be concise and focused on what changed. Learning reflections are a different genre 
                of annotation entirely - they&apos;re about personal growth, insights, and deeper understanding. With PushToMemory, 
                you can write as much as you want about your learning journey without cluttering your commit history.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-blue-700 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Why capture learnings right after a push?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                The best time to reflect is when the experience is fresh. While it can be challenging to get developers 
                to document their learnings regularly, capturing insights immediately after a push is natural and effortless. 
                The context is still fresh, making it the perfect moment for meaningful reflection.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-emerald-700 flex items-center gap-2">
                <Users className="h-5 w-5" />
                How does this help team growth?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                PushToMemory transforms individual learnings into collective wisdom. Teams can receive weekly highlight newsletters 
                showcasing the most valuable insights from their colleagues. All learnings can be exported to shared wikis or 
                other knowledge bases, ensuring that valuable insights are preserved and shared.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-purple-700 flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                What's on the roadmap?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                While we&apos;re focused on perfecting the core experience, we&apos;re exploring integrations with tools like Notion, 
                Slack, and Telegram. Our priority is making the reflection process as seamless as possible while ensuring 
                your team's collective knowledge grows with every push.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-blue-700 flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Why is this especially important in the age of AI?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                As a developer who actively uses AI coding tools like Cursor and Replit, I created PushToMemory out of a deep concern: it&apos;s becoming 
                too easy to generate code without truly understanding it. Many of us, myself included, risk falling into a pattern 
                of mindlessly generating code, not knowing why it works, or even why we made certain decisions. This tool exists 
                to put our reflective capacities back in the loop. By consciously pausing to reflect after each push, we protect 
                ourselves from letting our understanding atrophy. It's not just about documenting what we did - it's about 
                preserving our ability to think deeply about our code in an age where it's tempting to let AI do the thinking for us.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-emerald-700 flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Can I contribute to this project?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Absolutely! PushToMemory is an open source project created by <a href="https://github.com/garysheng" className="text-emerald-600 hover:text-emerald-700 hover:underline">Gary Sheng</a>, 
                and we welcome contributions from the community. Whether you want to add features, fix bugs, or improve documentation, 
                visit our <a href="https://github.com/orgs/garyspublicrepos/repositories" className="text-emerald-600 hover:text-emerald-700 hover:underline">GitHub repository</a> to 
                get started. Together, we can make team learning and knowledge sharing even better!
              </p>
            </div>
          </div>
        </div>
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
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-xl md:text-2xl h-16 px-12 shadow-lg hover:shadow-xl transition-all"
          >
            Get Started Today ✨
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
        </div>
      </div>
    </main>
  )
}
