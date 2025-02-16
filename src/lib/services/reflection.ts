import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  getDoc,
  orderBy,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { PushReflectionBase, ReflectionStatus } from '@/types'

interface PushReflectionCreate extends Omit<PushReflectionBase, 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp
  updatedAt: Timestamp
}

export async function createPushReflection(
  userId: string,
  repositoryName: string,
  commits: PushReflectionBase['commits']
): Promise<string> {
  // Generate a unique ID using the repository name and first commit's ID
  // Clean both parts to ensure a valid document path
  const cleanRepoName = repositoryName.replace(/[^a-zA-Z0-9-]/g, '')
  const cleanCommitId = commits[0].id.replace(/[^a-zA-Z0-9-]/g, '')
  const id = `${cleanRepoName}-${cleanCommitId}`
  
  const now = Timestamp.fromDate(new Date())
  const reflection: Omit<PushReflectionCreate, 'id'> = {
    userId,
    repositoryName,
    commits,
    reflection: '', // Will be filled in when user writes their reflection
    status: 'pending', // Default status is pending
    createdAt: now,
    updatedAt: now
  }

  await setDoc(
    doc(db, 'pushReflections', id),
    reflection
  )

  return id
}

export async function updateReflection(
  reflectionId: string,
  reflection: string,
  status: ReflectionStatus = 'completed'
): Promise<void> {
  const reflectionRef = doc(db, 'pushReflections', reflectionId)
  
  await setDoc(reflectionRef, {
    reflection,
    status,
    updatedAt: Timestamp.fromDate(new Date())
  }, { merge: true })
}

export async function getPushReflection(
  reflectionId: string
): Promise<PushReflectionBase | null> {
  const docRef = doc(db, 'pushReflections', reflectionId)
  const docSnap = await getDoc(docRef)
  
  if (!docSnap.exists()) return null
  
  return {
    ...docSnap.data(),
    id: docSnap.id
  } as PushReflectionBase
}

export async function getUserReflections(
  userId: string,
  repositoryName?: string
): Promise<PushReflectionBase[]> {
  const reflectionsRef = collection(db, 'pushReflections')
  let q = query(
    reflectionsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )

  if (repositoryName) {
    q = query(q, where('repositoryName', '==', repositoryName))
  }

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  } as PushReflectionBase))
} 