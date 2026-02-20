/**
 * Accès Firestore côté client - lectures/écritures en temps réel
 * Utilisable quand l'utilisateur est connecté via Firebase Auth (auth.currentUser)
 *
 * Exemple d'utilisation :
 * import { db, onSnapshot, collection, query, orderBy } from './firestoreClient'
 * const unsubscribe = onSnapshot(query(collection(db, 'prospects'), orderBy('createdAt', 'desc')), (snapshot) => {...})
 */
import { db } from './firebase'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore'

export {
  db,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
}
