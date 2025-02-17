'use client'

import { useCallback, useState, useEffect } from 'react'
import { Loader2, CheckCircle2, AlertCircle, RefreshCcw, Github, ArrowUpDown, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { storeRepositoryWebhook, getRepositoryWebhook, deleteRepositoryWebhook, getUserRepositories } from '@/lib/services/repository'
import { createRepositoryWebhook, deleteRepositoryWebhook as deleteGithubRepositoryWebhook } from '@/lib/github'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Repository {
  name: string
  full_name: string
  owner: {
    login: string
  }
  isConnected?: boolean
  updated_at: string
}

type SortOption = 'alphabetical' | 'updated'

export function RepositorySelector() {
  const { user, getGithubToken } = useAuth()
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set())
  const [hasLoadedAdditionalRepos, setHasLoadedAdditionalRepos] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('updated')

  const sortRepositories = (repos: Repository[], sortOption: SortOption) => {
    return [...repos].sort((a, b) => {
      if (sortOption === 'alphabetical') {
        return a.full_name.toLowerCase().localeCompare(b.full_name.toLowerCase())
      } else {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }
    })
  }

  // Load connected repositories from Firestore
  const loadConnectedRepositories = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const userRepos = await getUserRepositories(user.uid)
      
      if (userRepos.length > 0) {
        const connectedRepoObjects = userRepos.map(repo => ({
          name: repo.repository,
          full_name: `${repo.owner}/${repo.repository}`,
          owner: {
            login: repo.owner
          },
          isConnected: true,
          updated_at: new Date().toISOString() // We don't store this in Firestore, so use current date
        }))
        setRepositories(connectedRepoObjects)
      }
    } catch (error) {
      console.error('Error loading connected repositories:', error)
      setError('Failed to load connected repositories')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Load connected repos when component mounts or user changes
  useEffect(() => {
    loadConnectedRepositories()
  }, [loadConnectedRepositories])

  const fetchAdditionalRepositories = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const token = await getGithubToken()
      const response = await fetch(
        'https://api.github.com/user/repos?affiliation=owner,collaborator&visibility=all&per_page=100',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch repositories')
      }

      const data = await response.json()
      
      // Create a set of existing repo full names for quick lookup
      const existingRepoNames = new Set(repositories.map(repo => repo.full_name))
      
      // Add any new repositories that aren't already in our list
      const newRepos = data
        .filter((repo: Repository) => !existingRepoNames.has(repo.full_name))
        .map((repo: Repository) => ({
          ...repo,
          isConnected: false
        }))

      setRepositories(prev => [...prev, ...newRepos])
      setHasLoadedAdditionalRepos(true)
    } catch (error) {
      console.error('Error fetching additional repositories:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch additional repositories')
    } finally {
      setLoading(false)
    }
  }, [getGithubToken, repositories])

  const handleSortChange = (value: SortOption) => {
    setSortBy(value)
    setRepositories(prev => sortRepositories(prev, value))
  }

  const handleToggleRepository = (repoFullName: string) => {
    setSelectedRepos(prev => {
      const newSet = new Set(prev)
      if (newSet.has(repoFullName)) {
        newSet.delete(repoFullName)
      } else {
        newSet.add(repoFullName)
      }
      return newSet
    })
  }

  const handleConnectSelected = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const token = await getGithubToken()
      const results: string[] = []

      for (const repoFullName of selectedRepos) {
        const [owner, repo] = repoFullName.split('/')
        const { id: webhookId, secret: webhookSecret } = await createRepositoryWebhook(owner, repo, token)
        await storeRepositoryWebhook(user?.uid || '', owner, repo, webhookId, webhookSecret)
        results.push(repoFullName)
      }

      if (results.length > 0) {
        setSuccess(`Successfully connected ${results.length} repositories`)
        // Update local state
        setRepositories(prev => 
          prev.map(repo => 
            results.includes(repo.full_name) ? { ...repo, isConnected: true } : repo
          )
        )
        setSelectedRepos(new Set())
      }
    } catch (error) {
      console.error('Error connecting repositories:', error)
      setError(error instanceof Error ? error.message : 'Failed to connect repositories')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnectRepository = async (repoFullName: string) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const token = await getGithubToken()
      const [owner, repo] = repoFullName.split('/')
      const webhook = await getRepositoryWebhook(user?.uid || '', owner, repo)
      
      if (webhook) {
        await deleteGithubRepositoryWebhook(owner, repo, webhook.webhookId, token)
        await deleteRepositoryWebhook(webhook.id)
        
        // Update local state
        setRepositories(prev => prev.filter(repo => repo.full_name !== repoFullName))
        setSuccess(`Successfully disconnected ${repoFullName}`)
      }
    } catch (error) {
      console.error('Error disconnecting repository:', error)
      setError(error instanceof Error ? error.message : 'Failed to disconnect repository')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect Your Repository</CardTitle>
        <CardDescription>
          Select repositories to enable automatic reflection prompts on code pushes.
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

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select
              value={sortBy}
              onValueChange={(value: SortOption) => handleSortChange(value)}
            >
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Last Updated</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAdditionalRepositories}
            disabled={loading}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh List
          </Button>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto border border-white/10 rounded-lg p-4 bg-gradient-to-br from-zinc-900/50 via-zinc-900/30 to-zinc-900/50 backdrop-blur-sm">
          {loading && repositories.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : repositories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Github className="w-12 h-12 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm text-center max-w-sm">
                No repositories connected yet. Click below to browse available repositories.
              </p>
              <Button
                variant="outline"
                size="lg"
                onClick={fetchAdditionalRepositories}
                disabled={loading}
              >
                <Plus className="mr-2 h-4 w-4" />
                Browse Repositories
              </Button>
            </div>
          ) : (
            <>
              {repositories.map((repo) => (
                <div 
                  key={repo.full_name} 
                  className="flex items-center justify-between py-2 px-3 hover:bg-white/5 rounded-lg transition-colors duration-200 bg-gradient-to-r from-white/[0.02] to-transparent border border-white/[0.05] group"
                >
                  <div 
                    className="flex items-center space-x-3 flex-1 cursor-pointer"
                    onClick={() => !repo.isConnected && handleToggleRepository(repo.full_name)}
                  >
                    <div className="relative flex items-center justify-center">
                      <Checkbox
                        checked={selectedRepos.has(repo.full_name)}
                        onCheckedChange={() => handleToggleRepository(repo.full_name)}
                        disabled={loading || repo.isConnected}
                        className="group-hover:border-white/30 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm text-white/90 truncate">{repo.full_name}</span>
                      <span className="text-xs text-muted-foreground">
                        Updated {new Date(repo.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {repo.isConnected ? (
                    <div className="flex items-center pl-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnectRepository(repo.full_name)}
                        disabled={loading}
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        Disconnect
                      </Button>
                      <CheckCircle2 className="h-4 w-4 text-green-500 ml-2" />
                    </div>
                  ) : null}
                </div>
              ))}
              
              {!hasLoadedAdditionalRepos && (
                <div className="flex justify-center mt-4 pt-4 border-t border-white/10">
                  <Button
                    variant="outline"
                    onClick={fetchAdditionalRepositories}
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
                        Browse More Repositories
                      </>
                    )}
                  </Button>
                </div>
              )}

              {selectedRepos.size > 0 && (
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleConnectSelected}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      `Connect ${selectedRepos.size} Repositories`
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