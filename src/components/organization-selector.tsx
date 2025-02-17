'use client'

import { useCallback, useState, useEffect } from 'react'
import { Loader2, CheckCircle2, AlertCircle, Building2, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { 
  storeOrganizationWebhook, 
  getOrganizationWebhook, 
  deleteOrganizationWebhook,
  getUserOrganizations 
} from '@/lib/services/organization'
import { 
  listUserOrganizations,
  createOrganizationWebhook, 
  deleteGithubWebhook 
} from '@/lib/github'

interface Organization {
  login: string
  isConnected?: boolean
}

export function OrganizationSelector() {
  const { user, getGithubToken } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [hasLoadedAdditionalOrgs, setHasLoadedAdditionalOrgs] = useState(false)

  // Load connected organizations from Firestore
  const loadConnectedOrganizations = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const userOrgs = await getUserOrganizations(user.uid)
      
      if (userOrgs.length > 0) {
        const connectedOrgObjects = userOrgs.map(org => ({
          login: org,
          isConnected: true
        }))
        setOrganizations(connectedOrgObjects)
      }
    } catch (error) {
      console.error('Error loading connected organizations:', error)
      setError('Failed to load connected organizations')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Load connected orgs when component mounts or user changes
  useEffect(() => {
    loadConnectedOrganizations()
  }, [loadConnectedOrganizations])

  const fetchAdditionalOrganizations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const token = await getGithubToken()
      const data = await listUserOrganizations(token)
      
      // Create a set of existing org logins for quick lookup
      const existingOrgLogins = new Set(organizations.map(org => org.login))
      
      // Add any new organizations that aren't already in our list
      const newOrgs = data.filter((org: Organization) => !existingOrgLogins.has(org.login))
        .map((org: Organization) => ({
          ...org,
          isConnected: false
        }))

      setOrganizations(prev => [...prev, ...newOrgs])
      setHasLoadedAdditionalOrgs(true)
    } catch (error) {
      console.error('Error fetching additional organizations:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch additional organizations')
    } finally {
      setLoading(false)
    }
  }, [getGithubToken, organizations])

  const handleConnectOrg = async (orgName: string) => {
    if (!user) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const token = await getGithubToken()
      
      // Check if webhook already exists
      const existingWebhook = await getOrganizationWebhook(user.uid, orgName)
      if (existingWebhook) {
        setError('This organization is already connected')
        return
      }

      const { id: webhookId, secret: webhookSecret } = await createOrganizationWebhook(orgName, token)
      await storeOrganizationWebhook(user.uid, orgName, webhookId, webhookSecret)

      // Update the local state
      setOrganizations(prev => 
        prev.map(org => 
          org.login === orgName ? { ...org, isConnected: true } : org
        )
      )
      
      setSuccess(`Successfully connected to ${orgName}`)
    } catch (error) {
      console.error('Error connecting organization:', error)
      setError(error instanceof Error ? error.message : 'Failed to connect organization')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async (orgName: string) => {
    if (!user) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const token = await getGithubToken()
      const webhook = await getOrganizationWebhook(user.uid, orgName)
      
      if (!webhook) {
        throw new Error('No webhook found for this organization')
      }

      await deleteGithubWebhook(orgName, webhook.webhookId, token)
      await deleteOrganizationWebhook(webhook.id)
      
      // Update the local state
      setOrganizations(prev => prev.filter(org => org.login !== orgName))
      
      setSuccess(`Successfully disconnected ${orgName}`)
    } catch (error) {
      console.error('Error disconnecting organization:', error)
      setError(error instanceof Error ? error.message : 'Failed to disconnect organization')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect Organization</CardTitle>
        <CardDescription>
          Select a GitHub organization to connect
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center text-red-500 text-sm">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}
        
        {success && (
          <div className="flex items-center text-green-500 text-sm">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {success}
          </div>
        )}

        <div className="space-y-2 max-h-[400px] overflow-y-auto border border-white/10 rounded-lg p-4 bg-gradient-to-br from-zinc-900/50 via-zinc-900/30 to-zinc-900/50 backdrop-blur-sm">
          {loading && organizations.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : organizations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Building2 className="w-12 h-12 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm text-center max-w-sm">
                No organizations connected yet. Click below to browse available organizations.
              </p>
              <Button
                variant="outline"
                size="lg"
                onClick={fetchAdditionalOrganizations}
                disabled={loading}
              >
                <Plus className="mr-2 h-4 w-4" />
                Browse Organizations
              </Button>
            </div>
          ) : (
            <>
              {organizations.map((org) => (
                <div 
                  key={org.login}
                  className="flex items-center justify-between py-2 px-3 hover:bg-white/5 rounded-lg transition-colors duration-200 bg-gradient-to-r from-white/[0.02] to-transparent border border-white/[0.05]"
                >
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-white/90">{org.login}</span>
                  </div>
                  {org.isConnected ? (
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnect(org.login)}
                        disabled={loading}
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        Disconnect
                      </Button>
                      <CheckCircle2 className="h-4 w-4 text-green-500 ml-2" />
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConnectOrg(org.login)}
                      disabled={loading}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              ))}
              
              {!hasLoadedAdditionalOrgs && (
                <div className="flex justify-center mt-4 pt-4 border-t border-white/10">
                  <Button
                    variant="outline"
                    onClick={fetchAdditionalOrganizations}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading More...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Browse More Organizations
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 