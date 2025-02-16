import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { PushReflectionBase, PushReflection, OrganizationWebhookBase, OrganizationWebhook } from "@/types"
import { toast } from "@/hooks/use-toast"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toFrontendReflection(reflection: PushReflectionBase): PushReflection {
  // Aggregate file changes from all commits
  const added = new Set<string>()
  const modified = new Set<string>()
  const removed = new Set<string>()

  reflection.commits.forEach(commit => {
    commit.added?.forEach(file => added.add(file))
    commit.modified?.forEach(file => modified.add(file))
    commit.removed?.forEach(file => removed.add(file))
  })

  return {
    ...reflection,
    id: reflection.id,
    createdAt: reflection.createdAt.toDate(),
    updatedAt: reflection.updatedAt.toDate(),
    added: Array.from(added),
    modified: Array.from(modified),
    removed: Array.from(removed),
    distinct: true
  }
}

export function toFrontendWebhook(webhook: OrganizationWebhookBase): OrganizationWebhook {
  return {
    ...webhook,
    createdAt: webhook.createdAt.toDate(),
    updatedAt: webhook.updatedAt.toDate()
  }
}

export function toFrontendReflections(reflections: PushReflectionBase[]): PushReflection[] {
  return reflections.map(toFrontendReflection)
}

export const styledToast = {
  error: (message: string) => {
    toast({
      title: "Error",
      description: message,
      variant: "destructive"
    })
  },
  success: (message: string) => {
    toast({
      title: "Success",
      description: message
    })
  },
  info: (message: string) => {
    toast({
      title: "Info",
      description: message
    })
  }
}
