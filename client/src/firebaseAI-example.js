/**
 * Exemple d'utilisation du SDK Firebase AI (Gemini)
 *
 * Pour utiliser dans un composant React :
 *
 * import { generateContent, generativeModel } from './firebase'
 *
 * // Option 1 : Utiliser la fonction helper
 * const text = await generateContent("Écris une histoire sur un sac à dos magique.")
 * console.log(text)
 *
 * // Option 2 : Utiliser le modèle directement
 * const result = await generativeModel.generateContent("Explique-moi le CRM en une phrase.")
 * const response = result.response
 * console.log(response.text())
 *
 * // Option 3 : Avec gestion d'erreurs
 * try {
 *   const réponse = await generateContent("Résume ce texte : ...")
 *   setState(réponse)
 * } catch (error) {
 *   console.error("Erreur Gemini:", error)
 * }
 */

export {}
