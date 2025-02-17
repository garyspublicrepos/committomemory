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
import { RepositoryWebhookBase } from '@/types'

// Interface for creating a new webhook
interface RepositoryWebhookCreate extends Omit<RepositoryWebhookBase, 'createdAt' | 'updatedAt'> {
  createdAt: FieldValue
  updatedAt: FieldValue
}

export async function storeRepositoryWebhook(
  userId: string,
  owner: string,
  repository: string,
  webhookId: number,
  webhookSecret: string
): Promise<void> {
  const webhook: RepositoryWebhookCreate = {
    id: `${owner}-${repository}-${webhookId}`,
    owner,
    repository,
    webhookId,
    webhookSecret,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  await setDoc(
    doc(db, 'repositoryWebhooks', webhook.id),
    webhook
  )
}

export async function getRepositoryWebhook(
  userId: string,
  owner: string,
  repository: string
): Promise<RepositoryWebhookBase | null> {
  const webhooksRef = collection(db, 'repositoryWebhooks')
  const q = query(
    webhooksRef,
    where('owner', '==', owner),
    where('repository', '==', repository),
    where('userId', '==', userId)
  )

  const querySnapshot = await getDocs(q)
  if (querySnapshot.empty) return null

  const doc = querySnapshot.docs[0]
  return doc.data() as RepositoryWebhookBase
}

export async function deleteRepositoryWebhook(
  webhookId: string
): Promise<void> {
  await deleteDoc(doc(db, 'repositoryWebhooks', webhookId))
}

export async function getUserRepositories(
  userId: string
): Promise<Array<{ owner: string, repository: string }>> {
  const webhooksRef = collection(db, 'repositoryWebhooks')
  const q = query(webhooksRef, where('userId', '==', userId))
  
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => {
    const data = doc.data()
    return {
      owner: data.owner,
      repository: data.repository
    }
  })
}

export async function getRepositoryWebhookByFullName(
  owner: string,
  repository: string
): Promise<RepositoryWebhookBase | null> {
  const webhooksRef = collection(db, 'repositoryWebhooks')
  const q = query(
    webhooksRef,
    where('owner', '==', owner),
    where('repository', '==', repository)
  )

  const querySnapshot = await getDocs(q)
  if (querySnapshot.empty) return null

  const doc = querySnapshot.docs[0]
  return doc.data() as RepositoryWebhookBase
} 