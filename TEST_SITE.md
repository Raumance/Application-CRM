# 🧪 Guide de Test du CRM CarWazPlan

## ✅ Statut des Serveurs

### Backend (Node.js/Express)
- **URL** : http://localhost:4000
- **Statut** : ✅ Démarré et connecté à MongoDB
- **Base de données** : `mongodb://localhost:27017/carwazplan_crm`

### Frontend (React/Vite)
- **URL** : http://localhost:5173
- **Statut** : ✅ Démarré

---

## 📋 Checklist de Test

### 1. Authentification
- [ ] Ouvrir http://localhost:5173 dans le navigateur
- [ ] Vérifier l'affichage de la page de connexion
- [ ] Tester l'inscription d'un nouvel utilisateur
- [ ] Tester la connexion avec les identifiants créés
- [ ] Vérifier que le token JWT est stocké dans localStorage

### 2. Dashboard Principal
- [ ] Vérifier l'affichage des KPI (Contacts qualifiés, RDV tenus, CA total)
- [ ] Vérifier l'affichage du stock (Disponibles, Réservés, Vendus)
- [ ] Vérifier la liste des "Devis en cours"
- [ ] Tester l'ajout d'un devis depuis le dashboard

### 3. Page Prospects / Clients
- [ ] Vérifier l'affichage de la liste des prospects
- [ ] Tester la recherche (champ de recherche)
- [ ] Tester le filtre par statut
- [ ] Tester l'ajout d'un nouveau prospect
- [ ] Tester la modification d'un prospect (bouton "Modifier")
- [ ] Tester la suppression d'un prospect (bouton "Supprimer")

### 4. Page Tâches
- [ ] Vérifier l'affichage de la liste des tâches
- [ ] Tester la recherche
- [ ] Tester le filtre par statut
- [ ] Tester l'ajout d'une nouvelle tâche
- [ ] Tester la modification d'une tâche
- [ ] Tester la suppression d'une tâche

### 5. Page Stock Véhicules
- [ ] Vérifier l'affichage de la liste des véhicules
- [ ] Tester la recherche
- [ ] Tester le filtre par statut
- [ ] Tester l'ajout d'un nouveau véhicule
- [ ] Tester la modification d'un véhicule
- [ ] Tester la suppression d'un véhicule

### 6. Page Devis
- [ ] Vérifier l'affichage de tous les devis (pas seulement "En cours")
- [ ] Tester la recherche
- [ ] Tester le filtre par statut
- [ ] Tester l'ajout d'un nouveau devis
- [ ] Tester la modification d'un devis
- [ ] Tester la suppression d'un devis
- [ ] **Tester l'export PDF** (bouton "Export PDF")
- [ ] **Tester l'export Excel** (bouton "Export Excel")

### 7. Page Interactions
- [ ] Vérifier l'affichage de la liste des interactions
- [ ] Tester la recherche
- [ ] Tester le filtre par type (Appel, Email, RDV, Autre)
- [ ] Tester l'ajout d'une nouvelle interaction
- [ ] Tester la modification d'une interaction
- [ ] Tester la suppression d'une interaction

### 8. Page Factures
- [ ] Vérifier l'affichage de la liste des factures
- [ ] Tester la recherche
- [ ] Tester le filtre par statut
- [ ] Tester l'ajout d'une nouvelle facture
- [ ] Tester la modification d'une facture
- [ ] Tester la suppression d'une facture
- [ ] **Tester l'export PDF** (bouton "Export PDF")
- [ ] **Tester l'export Excel** (bouton "Export Excel")

### 9. Page Relances Emails
- [ ] Vérifier l'affichage de la liste des modèles de relance
- [ ] Tester l'ajout d'un nouveau modèle
- [ ] Tester la modification d'un modèle
- [ ] Tester la suppression d'un modèle

### 10. Page Paramètres
- [ ] Vérifier l'affichage de la liste des utilisateurs (admin uniquement)
- [ ] Tester la modification du rôle d'un utilisateur
- [ ] Tester la suppression d'un utilisateur

### 11. Design & Responsive
- [ ] Vérifier que toutes les pages ont le même design uniforme
- [ ] Tester sur desktop (grand écran)
- [ ] Tester sur tablette (réduire la fenêtre)
- [ ] Tester sur mobile (mode responsive)
- [ ] Vérifier que le menu hamburger fonctionne sur mobile
- [ ] Vérifier que les tableaux sont scrollables horizontalement sur mobile

### 12. Navigation
- [ ] Tester tous les liens du sidebar
- [ ] Vérifier que le menu actif est bien surligné
- [ ] Tester la fermeture du sidebar sur mobile (overlay)

---

## 🐛 Problèmes Potentiels à Vérifier

1. **MongoDB non démarré** : Si le backend ne se connecte pas, vérifier que MongoDB est démarré
   ```powershell
   net start MongoDB
   ```

2. **Port déjà utilisé** : Si le port 4000 ou 5173 est déjà utilisé, modifier le port dans `.env` ou `vite.config.js`

3. **Erreurs CORS** : Vérifier que le backend autorise les requêtes depuis `http://localhost:5173`

4. **Token expiré** : Si vous êtes déconnecté après 8h, reconnectez-vous

---

## 📝 Notes de Test

**Date du test** : _______________

**Testeur** : _______________

**Résultats** :
- ✅ Fonctionne correctement
- ⚠️ Problème mineur
- ❌ Problème bloquant

---

## 🎯 Points Clés à Tester

1. **CRUD complet** sur toutes les entités
2. **Filtres et recherche** fonctionnels
3. **Export PDF/Excel** pour Devis et Factures
4. **Design responsive** sur tous les écrans
5. **Authentification** sécurisée avec JWT

---

**Bon test ! 🚀**
