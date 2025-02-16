import { Timestamp } from 'firebase/firestore'

export type ReflectionStatus = 'pending' | 'completed' | 'skipped'

// Backend Types
export interface PushReflectionBase {
  id: string
  userId: string
  repositoryName: string
  commits: Array<{
    id: string
    message: string
    timestamp: string
    url: string
    author: {
      name: string
      email: string
    }
    added: string[]
    modified: string[]
    removed: string[]
  }>
  reflection: string
  status: ReflectionStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface OrganizationWebhookBase {
  id: string
  organizationName: string
  webhookId: number
  webhookSecret: string
  userId: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Frontend Types
export interface PushReflection extends Omit<PushReflectionBase, 'createdAt' | 'updatedAt'> {
  createdAt: Date
  updatedAt: Date
  added: string[]
  modified: string[]
  removed: string[]
  distinct: boolean
}

export interface OrganizationWebhook extends Omit<OrganizationWebhookBase, 'createdAt' | 'updatedAt'> {
  createdAt: Date
  updatedAt: Date
}

export interface GithubWebhookPayload {
  repository: {
    name: string
    full_name: string
    owner: {
      name: string
      email: string
    }
  }
  pusher: {
    name: string
    email: string
  }
  commits: Array<{
    id: string
    message: string
    timestamp: string
    url: string
    author: {
      name: string
      email: string
    }
    added: string[]
    modified: string[]
    removed: string[]
  }>
}

export interface User {
  id: string
  email: string
  name: string
  githubId: string
  avatarUrl: string
} 