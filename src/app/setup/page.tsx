'use client'

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Steps, Step } from "@/components/ui/steps"
import { Button } from "@/components/ui/button"
import { Github, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { OrganizationSelector } from "@/components/organization-selector"
import { useState } from "react"
import { 
  getUserOrganizations, 
  deleteOrganizationWebhook,
  getOrganizationWebhook 
} from "@/lib/services/organization"
import { deleteGithubWebhook } from "@/lib/github"

export default function SetupPage() {
  const { user, signInWithGithub, signOut, getGithubToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGitHubAuth = async () => {
    try {
      if (user) {
        setLoading(true)
        setError(null)
        
        // Get the GitHub token before signing out
        const token = await getGithubToken()
        
        // Get all connected organizations
        const orgs = await getUserOrganizations(user.uid)
        
        // For each organization, get the webhook and delete it
        for (const orgName of orgs) {
          const webhook = await getOrganizationWebhook(user.uid, orgName)
          if (webhook) {
            // Delete from GitHub
            await deleteGithubWebhook(orgName, webhook.webhookId, token)
            // Delete from our database
            await deleteOrganizationWebhook(webhook.id)
          }
        }
        
        // Finally, sign out
        await signOut()
      } else {
        await signInWithGithub()
      }
    } catch (error) {
      console.error('Authentication error:', error)
      setError(error instanceof Error ? error.message : 'Failed to process request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container mx-auto py-12 px-4">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-8">
        Setup Guide
      </h1>
      
      <div className="mb-8">
        <Button size="lg" className="gap-2" onClick={handleGitHubAuth} disabled={loading}>
          <Github className="w-5 h-5" />
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {user ? "Disconnecting..." : "Connecting..."}
            </>
          ) : (
            user ? "Disconnect GitHub" : "Connect GitHub Organization"
          )}
        </Button>
        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>
            Commit to Memory integrates with your GitHub organization to help your team reflect on their code changes
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
            
            <Step title="Connect Your Organization">
              {user ? (
                <OrganizationSelector />
              ) : (
                "After signing in, you&apos;ll be prompted to select and authorize access to your GitHub organization."
              )}
            </Step>
            
            <Step title="Automatic Configuration">
              We&apos;ll automatically:
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Set up the necessary webhook in your organization</li>
                <li>Configure security settings</li>
                <li>Start tracking push events</li>
              </ul>
            </Step>
            
            <Step title="Start Reflecting">
              Your team members will receive prompts to reflect on their learning after each commit.
              All reflections are private to your organization.
            </Step>
          </Steps>
        </CardContent>
      </Card>

      <Alert>
        <AlertTitle>Security First</AlertTitle>
        <AlertDescription>
          We use Firebase Authentication and GitHub&apos;s OAuth system to ensure secure access. Your organization&apos;s data and access tokens are encrypted and stored safely.
        </AlertDescription>
      </Alert>
    </main>
  )
} 