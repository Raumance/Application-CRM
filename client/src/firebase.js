import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD3quqr1_ToMYwRArdDnnpLBR98Q9yfVjI',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'crm-application-e8c6c.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'crm-application-e8c6c',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'crm-application-e8c6c.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '200472744153',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:200472744153:web:f4e027c3a2dcaf803e6ec8',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-VHEQVC2GED',
}

const app = initializeApp(firebaseConfig)

let analytics = null
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app)
}

// Firebase Auth
const auth = getAuth(app)

// Firestore
const db = getFirestore(app)

// Firebase Cloud Messaging (notifications push)
let messaging = null
if (typeof window !== 'undefined' && 'Notification' in window) {
  try {
    messaging = getMessaging(app)
  } catch (_) {}
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) return null
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

async function getFCMToken() {
  if (!messaging) return null
  try {
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined,
    })
    return token
  } catch (err) {
    console.warn('FCM token:', err.message)
    return null
  }
}

function onForegroundMessage(callback) {
  if (!messaging) return () => {}
  return onMessage(messaging, callback)
}

// Firebase AI (Gemini) - API Gemini Developer
const ai = getAI(app, { backend: new GoogleAIBackend() })
// Modèle : gemini-3-flash-preview, gemini-2.0-flash ou gemini-1.5-flash selon votre cas
const generativeModel = getGenerativeModel(ai, { model: 'gemini-2.5-flash-native-audio-preview-12-2025' })

/**
 * Génère du texte à partir d'un prompt via Gemini
 * @param {string} prompt - Le texte à envoyer au modèle
 * @returns {Promise<string>} - La réponse générée
 */
async function generateContent(prompt) {
  const result = await generativeModel.generateContent(prompt)
  const response = result.response
  return response.text()
}

export {
  app,
  analytics,
  auth,
  db,
  messaging,
  ai,
  generativeModel,
  generateContent,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  requestNotificationPermission,
  getFCMToken,
  onForegroundMessage,
}
