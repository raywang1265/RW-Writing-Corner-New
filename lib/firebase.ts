import * as admin from 'firebase-admin'

export type Subscriber = {
  email: string
  subscribed: boolean
  createdAt: admin.firestore.Timestamp
  updatedAt: admin.firestore.Timestamp
}

let app: admin.app.App | undefined

function initializeFirebaseAdmin() {
  if (app) {
    return app
  }

  try {
    if (!admin.apps.length) {
      const projectId = process.env.FIREBASE_PROJECT_ID
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
      const privateKey = process.env.FIREBASE_PRIVATE_KEY

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
          'Missing Firebase environment variables. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY'
        )
      }

      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      })
    } else {
      app = admin.app()
    }

    return app
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error)
    throw error
  }
}

export function getFirestore() {
  const app = initializeFirebaseAdmin()
  return admin.firestore(app)
}

export { admin }
