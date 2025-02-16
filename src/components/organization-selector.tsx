'use client'

import { useCallback, useState } from 'react'
import { Loader2, CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/lib/auth-context'
import { storeOrganizationWebhook, getOrganizationWebhook, deleteOrganizationWebhook } from '@/lib/services/organization'

export function OrganizationSelector() {
  const { user, getGithubToken } = useAuth()
  const [organizations, setOrganizations] = useState<string[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectedOrg, setConnectedOrg] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchOrganizations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const token = await getGithubToken()
      const response = await fetch('https://api.github.com/user/orgs', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch organizations')
      }

      const data = await response.json()
      const orgs = data.map((org: { login: string }) => org.login)
      setOrganizations(orgs)

      // Check if any of these organizations already have a webhook
      for (const org of orgs) {
        const webhook = await getOrganizationWebhook(user?.uid || '', org)
        if (webhook) {
          setConnectedOrg(org)
          setSuccess(`Connected to ${org}`)
          break
        }
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch organizations')
    } finally {
      setLoading(false)
    }
  }, [getGithubToken, user])

  const handleConnectOrg = async () => {
    if (!selectedOrg || !user) {
      setError('Please select an organization')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const token = await getGithubToken()
      
      // Check if webhook already exists
      const existingWebhook = await getOrganizationWebhook(user.uid, selectedOrg)
      if (existingWebhook) {
        setError('This organization is already connected')
        return
      }

      const response = await fetch('/api/webhooks/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization: selectedOrg,
          token,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to connect organization')
      }

      const { id: webhookId, secret: webhookSecret } = await response.json()
      
      // Store the webhook information in Firestore
      await storeOrganizationWebhook(user.uid, selectedOrg, webhookId, webhookSecret)

      setConnectedOrg(selectedOrg)
      setSuccess(`Successfully connected to ${selectedOrg}`)
    } catch (error) {
      console.error('Error connecting organization:', error)
      setError(error instanceof Error ? error.message : 'Failed to connect organization')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!connectedOrg) return

    setLoading(true)
    setError(null)

    try {
      const token = await getGithubToken()
      const webhook = await getOrganizationWebhook(user?.uid || '', connectedOrg)
      
      if (!webhook) {
        throw new Error('No webhook found for this organization')
      }

      const response = await fetch('/api/webhooks/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization: connectedOrg,
          webhookId: webhook.webhookId,
          token,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to disconnect organization')
      }

      await deleteOrganizationWebhook(webhook.id)
      
      setConnectedOrg(null)
      setSuccess(null)
      setSelectedOrg('')
    } catch (error) {
      console.error('Error disconnecting organization:', error)
      setError(error instanceof Error ? error.message : 'Failed to disconnect organization')
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Error
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={fetchOrganizations}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Retry Loading Organizations
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (success && connectedOrg) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Connected
          </CardTitle>
          <CardDescription>{success}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleDisconnect}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Disconnecting...
              </>
            ) : (
              'Disconnect'
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect Organization</CardTitle>
        <CardDescription>Select a GitHub organization to connect</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {organizations.length === 0 ? (
          <Button
            onClick={fetchOrganizations}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading Organizations...
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Load Organizations
              </>
            )}
          </Button>
        ) : (
          <>
            <Select
              value={selectedOrg}
              onValueChange={setSelectedOrg}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org} value={org}>
                    {org}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleConnectOrg}
              disabled={!selectedOrg || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
} 