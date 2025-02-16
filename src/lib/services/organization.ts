import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  serverTimestamp,
  FieldValue
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { OrganizationWebhookBase } from '@/types'

// Interface for creating a new webhook
interface OrganizationWebhookCreate extends Omit<OrganizationWebhookBase, 'createdAt' | 'updatedAt'> {
  createdAt: FieldValue
  updatedAt: FieldValue
}

export async function storeOrganizationWebhook(
  userId: string,
  organizationName: string,
  webhookId: number,
  webhookSecret: string
): Promise<void> {
  const webhook: OrganizationWebhookCreate = {
    id: `${organizationName}-${webhookId}`,
    organizationName,
    webhookId,
    webhookSecret,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  await setDoc(
    doc(db, 'organizationWebhooks', webhook.id),
    webhook
  )
}

export async function getOrganizationWebhook(
  userId: string,
  organizationName: string
): Promise<OrganizationWebhookBase | null> {
  const webhooksRef = collection(db, 'organizationWebhooks')
  const q = query(
    webhooksRef,
    where('organizationName', '==', organizationName),
    where('userId', '==', userId)
  )

  const querySnapshot = await getDocs(q)
  if (querySnapshot.empty) return null

  const doc = querySnapshot.docs[0]
  return doc.data() as OrganizationWebhookBase
}

export async function deleteOrganizationWebhook(
  webhookId: string
): Promise<void> {
  await deleteDoc(doc(db, 'organizationWebhooks', webhookId))
}

export async function getUserOrganizations(
  userId: string
): Promise<string[]> {
  const webhooksRef = collection(db, 'organizationWebhooks')
  const q = query(webhooksRef, where('userId', '==', userId))
  
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => doc.data().organizationName)
}

export async function getOrganizationWebhookByName(
  organizationName: string
): Promise<OrganizationWebhookBase | null> {
  const webhooksRef = collection(db, 'organizationWebhooks')
  const q = query(
    webhooksRef,
    where('organizationName', '==', organizationName)
  )

  const querySnapshot = await getDocs(q)
  if (querySnapshot.empty) return null

  const doc = querySnapshot.docs[0]
  return doc.data() as OrganizationWebhookBase
} 