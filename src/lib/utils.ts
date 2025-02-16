import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { PushReflectionBase, PushReflection, OrganizationWebhookBase, OrganizationWebhook } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toFrontendReflection(reflection: PushReflectionBase): PushReflection {
  return {
    ...reflection,
    id: reflection.id,
    createdAt: reflection.createdAt.toDate(),
    updatedAt: reflection.updatedAt.toDate()
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
