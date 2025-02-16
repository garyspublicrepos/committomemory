import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

// Initialize Firebase Admin
const apps = getApps()

if (!apps.length) {
  if (!process.env.FIREBASE_ADMIN_BASE64_CREDENTIALS) {
    throw new Error('Missing FIREBASE_ADMIN_BASE64_CREDENTIALS environment variable')
  }

  try {
    // Decode base64 credentials
    const decodedCredentials = Buffer.from(
      process.env.FIREBASE_ADMIN_BASE64_CREDENTIALS,
      'base64'
    ).toString('utf-8')
    
    const credentials = JSON.parse(decodedCredentials)
    
    initializeApp({
      credential: cert(credentials)
    })
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error)
    throw new Error('Failed to initialize Firebase Admin')
  }
}

export const auth = getAuth() 