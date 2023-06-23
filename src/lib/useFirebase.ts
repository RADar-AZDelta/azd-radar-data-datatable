import { PUBLIC_FIREBASE_API_KEY, PUBLIC_FIREBASE_APP_ID, PUBLIC_FIREBASE_AUTH_DOMAIN, PUBLIC_FIREBASE_DATABASE_URL, PUBLIC_FIREBASE_MESSAGING_SENDER_ID, PUBLIC_FIREBASE_PROJECT_ID, PUBLIC_FIREBASE_STORAGE_BUCKET,  } from '$env/static/public'
import { DataSnapshot, Database, child, get, getDatabase, ref, set } from 'firebase/database'
import { initializeApp, type FirebaseOptions, type FirebaseApp, getApps } from 'firebase/app'

const firebaseConfig: FirebaseOptions = {
  apiKey: PUBLIC_FIREBASE_API_KEY,
  authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: PUBLIC_FIREBASE_DATABASE_URL,
  projectId: PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: PUBLIC_FIREBASE_APP_ID,
}

let firebaseApp: FirebaseApp | undefined
let database: Database | undefined = undefined

if(PUBLIC_FIREBASE_API_KEY) {
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig)
    database = getDatabase(firebaseApp)
  }
}

function write(reference: string, data: Object) {
  if (!database) database = getDatabase(firebaseApp)
  const requestedReference = ref(database, reference)
  set(requestedReference, data)
}

async function readOnce(reference: string): Promise<any> {
  if (!database) database = getDatabase(firebaseApp)
  const requestedReference = ref(database)
  let receivedData: any
  await get(child(requestedReference, reference))
    .then((snapshot: DataSnapshot) => {
      receivedData = snapshot.val()
      return receivedData
    })
    .catch((error: any) => {
      console.error(error)
    })

  return receivedData
}

export { write, readOnce }
