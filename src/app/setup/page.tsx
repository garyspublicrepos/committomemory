'use client'

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Steps, Step } from "@/components/ui/steps"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { OrganizationSelector } from "@/components/organization-selector"
import { RepositorySelector } from "@/components/repository-selector"

export default function SetupPage() {
  const { user } = useAuth()

  return (
    <main className="container max-w-3xl mx-auto py-12 px-4 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Setup Your Reflections</CardTitle>
          <CardDescription>
            Connect your GitHub repositories to start capturing learning moments with every push.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Steps>
            <Step title="Secure Authentication">
              {user ? (
                <p className="text-green-500">✓ Connected as {user.displayName || user.email}</p>
              ) : (
                "Sign in securely with your GitHub account. We use Firebase Authentication to ensure your data is protected."
              )}
            </Step>
            
            <Step title="Connect Your Repositories">
              {user ? (
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4 bg-zinc-900 border border-white/10">
                    <TabsTrigger 
                      value="personal"
                      className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                    >
                      Personal Repositories
                    </TabsTrigger>
                    <TabsTrigger 
                      value="organization"
                      className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                    >
                      Organizations
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="personal">
                    <RepositorySelector />
                  </TabsContent>
                  <TabsContent value="organization">
                    <OrganizationSelector />
                  </TabsContent>
                </Tabs>
              ) : (
                "After signing in, you&apos;ll be prompted to select and authorize access to your GitHub repositories."
              )}
            </Step>
            
            <Step title="Automatic Configuration">
              We&apos;ll automatically:
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li key="webhook">Set up the necessary webhooks</li>
                <li key="security">Configure security settings</li>
                <li key="tracking">Start tracking push events</li>
              </ul>
            </Step>
            
            <Step title="Start Reflecting">
              You&apos;ll receive prompts to reflect on your learning after each commit.
              All reflections are private to you.
            </Step>
          </Steps>
        </CardContent>
      </Card>

      <Alert>
        <AlertTitle>Security First</AlertTitle>
        <AlertDescription>
          We use Firebase Authentication and GitHub&apos;s OAuth system to ensure secure access. Your data and access tokens are encrypted and stored safely.
        </AlertDescription>
      </Alert>
    </main>
  )
} 