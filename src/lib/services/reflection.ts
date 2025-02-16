import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  getDoc,
  orderBy,
  serverTimestamp,
  FieldValue
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { PushReflectionBase } from '@/types'

interface PushReflectionCreate extends Omit<PushReflectionBase, 'createdAt' | 'updatedAt' | 'id'> {
  createdAt: FieldValue
  updatedAt: FieldValue
}

export async function createPushReflection(
  userId: string,
  repositoryName: string,
  commits: PushReflectionBase['commits']
): Promise<string> {
  // Generate a unique ID using the first commit's ID
  const id = `${repositoryName}-${commits[0].id}`
  
  const reflection: PushReflectionCreate = {
    userId,
    repositoryName,
    commits,
    reflection: '', // Will be filled in when user writes their reflection
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  await setDoc(
    doc(db, 'pushReflections', id),
    reflection
  )

  return id
}

export async function updateReflection(
  reflectionId: string,
  reflection: string
): Promise<void> {
  await setDoc(
    doc(db, 'pushReflections', reflectionId),
    {
      reflection,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  )
}

export async function getPushReflection(
  reflectionId: string
): Promise<PushReflectionBase | null> {
  const docRef = doc(db, 'pushReflections', reflectionId)
  const docSnap = await getDoc(docRef)
  
  if (!docSnap.exists()) return null
  
  return docSnap.data() as PushReflectionBase
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
  return querySnapshot.docs.map(doc => doc.data() as PushReflectionBase)
} 