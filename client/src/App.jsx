import { useEffect, useState, useMemo } from 'react'
import './App.css'
import { exportToCSV, exportToPDF } from './exportUtils'
import { useToast } from './contexts/ToastContext'
import { useConfirm } from './contexts/ConfirmContext'
import { useDebounce } from './hooks/useDebounce'
import { DashboardChart } from './components/DashboardChart'
import { DashboardCalendar } from './components/DashboardCalendar'

// En dev sur localhost : utiliser directement le backend pour éviter les problèmes de proxy (ex: PDF)
const API_BASE = import.meta.env.VITE_API_URL ?? (typeof window !== 'undefined' && window.location?.hostname === 'localhost' ? 'http://localhost:4000' : '')

function App() {
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem('token') || ''
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('token')
    const urlError = params.get('error')
    if (urlToken) {
      localStorage.setItem('token', urlToken)
      window.history.replaceState({}, '', window.location.pathname)
      return urlToken
    }
    if (urlError) {
      const messages = {
        google_config: 'Connexion Google non configurée.',
        google_token: 'Erreur lors de la connexion Google.',
        google_email: 'Impossible de récupérer l\'email Google.',
        google_error: 'Une erreur est survenue.',
      }
      setTimeout(() => alert(messages[urlError] || messages.google_error), 100)
      window.history.replaceState({}, '', window.location.pathname)
    }
    return stored
  })
  const [authError, setAuthError] = useState('')
  const [authEmail, setAuthEmail] = useState(() => localStorage.getItem('remember_email') || '')
  const [authPassword, setAuthPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('remember_email'))
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  })
  const [registerSuccess, setRegisterSuccess] = useState('')
  const [stats, setStats] = useState(null)
  const [chartData, setChartData] = useState([])
  const [devis, setDevis] = useState([])
  const [devisAll, setDevisAll] = useState([])
  const [prospects, setProspects] = useState([])
  const [taches, setTaches] = useState([])
  const [vehicules, setVehicules] = useState([])
  const [interactions, setInteractions] = useState([])
  const [factures, setFactures] = useState([])
  const [relancesEmails, setRelancesEmails] = useState([])
  const [banques, setBanques] = useState([])
  const [newBanque, setNewBanque] = useState({ nom: '', tauxMin: '', tauxMax: '', apportMinPourcent: 20, dureeMaxMois: 60 })
  const [savingBanque, setSavingBanque] = useState(false)
  const [editingBanqueId, setEditingBanqueId] = useState(null)
  const [editingBanque, setEditingBanque] = useState({ nom: '', tauxMin: '', tauxMax: '', apportMinPourcent: 20, dureeMaxMois: 60 })
  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Filtres et recherche
  const [searchProspects, setSearchProspects] = useState('')
  const [filterProspectsStatut, setFilterProspectsStatut] = useState('')
  const [filterProspectsDossier, setFilterProspectsDossier] = useState('')
  const [prospectsSubview, setProspectsSubview] = useState('liste')
  const [searchCatalogue, setSearchCatalogue] = useState('')
  const [filterCatalogueStatut, setFilterCatalogueStatut] = useState('')
  const [searchTaches, setSearchTaches] = useState('')
  const [filterTachesStatut, setFilterTachesStatut] = useState('')
  const [searchVehicules, setSearchVehicules] = useState('')
  const [filterVehiculesStatut, setFilterVehiculesStatut] = useState('')
  const [searchDevis, setSearchDevis] = useState('')
  const [filterDevisStatut, setFilterDevisStatut] = useState('')
  const [searchInteractions, setSearchInteractions] = useState('')
  const [filterInteractionsType, setFilterInteractionsType] = useState('')
  const [searchFactures, setSearchFactures] = useState('')
  const [filterFacturesStatut, setFilterFacturesStatut] = useState('')
  const [profilNom, setProfilNom] = useState('')
  const [profilPrenom, setProfilPrenom] = useState('')
  const [profilDepartement, setProfilDepartement] = useState('')
  const [savingProfil, setSavingProfil] = useState(false)
  const { toast } = useToast()
  const { confirm } = useConfirm()
  const debouncedSearchProspects = useDebounce(searchProspects, 300)
  const debouncedSearchDevis = useDebounce(searchDevis, 300)
  const debouncedSearchTaches = useDebounce(searchTaches, 300)
  const debouncedSearchFactures = useDebounce(searchFactures, 300)
  const [newProspect, setNewProspect] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    ville: '',
    segment: '',
    statut: 'Prospect',
    revenuMensuel: '',
    typeVehicule: 'Neuf',
    budgetClient: '',
    apportInitial: '',
    dureeFinancement: 36,
    statutDossier: 'Nouveau Contact',
  })
  const [savingProspect, setSavingProspect] = useState(false)
  const [newTache, setNewTache] = useState({
    description: '',
    commercial: '',
    echeance: '',
    statut: 'A faire',
  })
  const [savingTache, setSavingTache] = useState(false)
  const [newVehicule, setNewVehicule] = useState({
    marque: '',
    modele: '',
    annee: '',
    prix: '',
    statut: 'Disponible',
    localisation: '',
  })
  const [savingVehicule, setSavingVehicule] = useState(false)
  const [newDevis, setNewDevis] = useState({
    numero: '',
    client: '',
    vehicule: '',
    montant: '',
    statut: 'En cours',
  })
  const [savingDevis, setSavingDevis] = useState(false)
  const [editingProspectId, setEditingProspectId] = useState(null)
  const [editingProspect, setEditingProspect] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    ville: '',
    segment: '',
    statut: 'Prospect',
    revenuMensuel: '',
    typeVehicule: 'Neuf',
    budgetClient: '',
    apportInitial: '',
    dureeFinancement: 36,
    statutDossier: 'Nouveau Contact',
  })
  const [editingTacheId, setEditingTacheId] = useState(null)
  const [editingTache, setEditingTache] = useState({
    description: '',
    commercial: '',
    echeance: '',
    statut: 'A faire',
  })
  const [editingVehiculeId, setEditingVehiculeId] = useState(null)
  const [editingVehicule, setEditingVehicule] = useState({
    marque: '',
    modele: '',
    annee: '',
    prix: '',
    statut: 'Disponible',
    localisation: '',
  })
  const [devisModalOpen, setDevisModalOpen] = useState(false)
  const [devisEditId, setDevisEditId] = useState(null)
  const [devisFormComplet, setDevisFormComplet] = useState({
    prospectId: '',
    numero: '',
    clientEntreprise: '',
    clientResponsable: '',
    clientTelephone: '',
    clientEmail: '',
    objet: '',
    premierLoyer: '',
    mensualiteFixe: '',
    dureeMois: 48,
    optionAchat: '',
    inclus: '- Véhicule neuf (selon désignation)\n- Assurance TOUS RISQUES 4 ans (Partenaire AXA/SANLAM)\n- Tracker GPS avec coupe-circuit 24h/24\n- Gestion administrative complète (Carte grise, plaques, mise à la route)\n- Optimisation fiscale : loyers déductibles (selon CGI Gabon)',
    conditions: '- Durée : selon contrat\n- OVPI obligatoire à la signature\n- Réserve de propriété jusqu\'à levée d\'option\n- Conformité OHADA & CIMA',
    statut: 'En cours',
    tvaTaux: 18,
    montantHT: '',
  })
  const [newInteraction, setNewInteraction] = useState({
    prospectId: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Appel',
    sujet: '',
    contenu: '',
  })
  const [savingInteraction, setSavingInteraction] = useState(false)
  const [editingInteractionId, setEditingInteractionId] = useState(null)
  const [editingInteraction, setEditingInteraction] = useState({
    prospectId: '',
    date: '',
    type: 'Appel',
    sujet: '',
    contenu: '',
  })
  const [newFacture, setNewFacture] = useState({
    numero: '',
    devisId: '',
    client: '',
    montant: '',
    statut: 'Émise',
    dateEmission: new Date().toISOString().split('T')[0],
    dateEcheance: '',
  })
  const [savingFacture, setSavingFacture] = useState(false)
  const [editingFactureId, setEditingFactureId] = useState(null)
  const [editingFacture, setEditingFacture] = useState({
    numero: '',
    devisId: '',
    client: '',
    montant: '',
    statut: 'Émise',
    dateEmission: '',
    dateEcheance: '',
  })
  const [newRelanceEmail, setNewRelanceEmail] = useState({
    nom: '',
    sujet: '',
    corps: '',
    sequence: 0,
  })
  const [savingRelanceEmail, setSavingRelanceEmail] = useState(false)
  const [editingRelanceEmailId, setEditingRelanceEmailId] = useState(null)
  const [editingRelanceEmail, setEditingRelanceEmail] = useState({
    nom: '',
    sujet: '',
    corps: '',
    sequence: 0,
  })

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError('')

        if (!token) return

        const headers = { Authorization: `Bearer ${token}` }

        const [
          statsRes,
          chartRes,
          meRes,
          devisRes,
          prospectsRes,
          tachesRes,
          vehiculesRes,
          interactionsRes,
          facturesRes,
          relancesEmailsRes,
          banquesRes,
          usersRes,
        ] = await Promise.all([
          fetch(`${API_BASE}/api/dashboard/stats`, { headers }),
          fetch(`${API_BASE}/api/dashboard/chart?days=30`, { headers }),
          fetch(`${API_BASE}/api/auth/me`, { headers }),
          fetch(`${API_BASE}/api/devis`, { headers }),
          fetch(`${API_BASE}/api/prospects`, { headers }),
          fetch(`${API_BASE}/api/taches`, { headers }),
          fetch(`${API_BASE}/api/vehicules`, { headers }),
          fetch(`${API_BASE}/api/interactions`, { headers }),
          fetch(`${API_BASE}/api/factures`, { headers }),
          fetch(`${API_BASE}/api/relances-emails`, { headers }),
          fetch(`${API_BASE}/api/banques`, { headers }).catch(() => ({ ok: false })),
          fetch(`${API_BASE}/api/users`, { headers }).catch(() => null),
        ])

        // Détecter token invalide/expiré (401) et rediriger vers la connexion
        if (statsRes.status === 401 || meRes.status === 401) {
          localStorage.removeItem('token')
          setToken('')
          setError('')
          setAuthError('Session expirée. Veuillez vous reconnecter.')
          return
        }

        if (!statsRes.ok) {
          const errData = await statsRes.json().catch(() => ({}))
          throw new Error(
            errData.error || `Erreur stats (${statsRes.status}): ${statsRes.statusText}`
          )
        }
        if (!devisRes.ok) {
          const errData = await devisRes.json().catch(() => ({}))
          throw new Error(
            errData.error || `Erreur devis (${devisRes.status}): ${devisRes.statusText}`
          )
        }
        if (!prospectsRes.ok) {
          const errData = await prospectsRes.json().catch(() => ({}))
          throw new Error(
            errData.error ||
              `Erreur prospects (${prospectsRes.status}): ${prospectsRes.statusText}`
          )
        }
        if (!tachesRes.ok) {
          const errData = await tachesRes.json().catch(() => ({}))
          throw new Error(
            errData.error || `Erreur tâches (${tachesRes.status}): ${tachesRes.statusText}`
          )
        }
        if (!vehiculesRes.ok) {
          const errData = await vehiculesRes.json().catch(() => ({}))
          throw new Error(
            errData.error ||
              `Erreur véhicules (${vehiculesRes.status}): ${vehiculesRes.statusText}`
          )
        }

        const statsJson = await statsRes.json()
        const chartJson = chartRes.ok ? await chartRes.json() : []
        const meJson = meRes.ok ? await meRes.json() : null
        const devisJson = await devisRes.json()
        const prospectsJson = await prospectsRes.json()
        const tachesJson = await tachesRes.json()
        const vehiculesJson = await vehiculesRes.json()
        const interactionsJson = await interactionsRes.json()
        const facturesJson = await facturesRes.json()
        const relancesEmailsJson = await relancesEmailsRes.json()
        const banquesJson = banquesRes?.ok ? await banquesRes.json() : []
        const usersJson = usersRes?.ok ? await usersRes.json() : []

        setStats(statsJson)
        setChartData(chartJson)
        setCurrentUser(meJson)
        setDevis(devisJson)
        setProspects(prospectsJson)
        setTaches(tachesJson)
        setVehicules(vehiculesJson)
        setInteractions(interactionsJson)
        setFactures(facturesJson)
        setRelancesEmails(relancesEmailsJson)
        setBanques(banquesJson)
        setUsers(usersJson)
      } catch (err) {
        console.error('Erreur chargement dashboard:', err)
        setError(err.message || 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [token])

  useEffect(() => {
    if (currentUser) {
      setProfilNom(currentUser.nom || '')
      setProfilPrenom(currentUser.prenom || '')
      setProfilDepartement(currentUser.departement || '')
    }
  }, [currentUser])

  // Raccourci clavier Escape (ferme sidebar, modals)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false)
        setDevisModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Charger tous les devis quand on accède à la page devis
  useEffect(() => {
    async function loadAllDevis() {
      if ((activeMenu !== 'devis' && activeMenu !== 'prospects') || !token) return
      try {
        const headers = { Authorization: `Bearer ${token}` }
        const res = await fetch(`${API_BASE}/api/devis/all`, { headers })
        if (res.ok) {
          const allDevisJson = await res.json()
          setDevisAll(allDevisJson)
        }
      } catch (err) {
        console.error('Erreur chargement tous les devis:', err)
      }
    }
    loadAllDevis()
  }, [activeMenu, token])

  async function handleAddProspect(e) {
    e.preventDefault()
    if (!newProspect.nom.trim() || !newProspect.prenom.trim()) return

    try {
      setSavingProspect(true)
      const res = await fetch(`${API_BASE}/api/prospects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newProspect),
      })

      if (!res.ok) {
        throw new Error("Erreur lors de la création du prospect")
      }

      const created = await res.json()
      setProspects((prev) => [created, ...prev])
      setNewProspect({
        prenom: '',
        nom: '',
        email: '',
        telephone: '',
        ville: '',
        segment: '',
        statut: 'Prospect',
        revenuMensuel: '',
        typeVehicule: 'Neuf',
        budgetClient: '',
        apportInitial: '',
        dureeFinancement: 36,
        statutDossier: 'Nouveau Contact',
      })
    } catch (err) {
      toast.error(err.message || 'Erreur inconnue')
    } finally {
      setSavingProspect(false)
    }
  }

  function startEditProspect(p) {
    setEditingProspectId(p._id || p.id)
    setEditingProspect({
      prenom: p.prenom || '',
      nom: p.nom || '',
      email: p.email || '',
      telephone: p.telephone || '',
      ville: p.ville || '',
      segment: p.segment || '',
      statut: p.statut || 'Prospect',
      revenuMensuel: p.revenuMensuel ?? '',
      typeVehicule: p.typeVehicule || 'Neuf',
      budgetClient: p.budgetClient ?? '',
      apportInitial: p.apportInitial ?? '',
      dureeFinancement: p.dureeFinancement ?? 36,
      statutDossier: p.statutDossier || 'Nouveau Contact',
    })
  }

  async function handleSaveProspect(id) {
    try {
      const res = await fetch(`${API_BASE}/api/prospects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingProspect),
      })
      if (!res.ok) {
        throw new Error('Erreur lors de la mise à jour du prospect')
      }
      const updated = await res.json()
      setProspects((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p))
      )
      setEditingProspectId(null)
    } catch (err) {
      toast.error(err.message || 'Erreur inconnue')
    }
  }

  async function handleDeleteProspect(id) {
    try {
      const res = await fetch(`${API_BASE}/api/prospects/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) {
        throw new Error('Erreur lors de la suppression du prospect')
      }
      setProspects((prev) => prev.filter((p) => p._id !== id && p.id !== id))
    } catch (err) {
      toast.error(err.message || 'Erreur inconnue')
    }
  }

  async function handleAddTache(e) {
    e.preventDefault()
    if (!newTache.description.trim()) return

    try {
      setSavingTache(true)
      const res = await fetch(`${API_BASE}/api/taches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTache),
      })

      if (!res.ok) {
        throw new Error("Erreur lors de la création de la tâche")
      }

      const created = await res.json()
      setTaches((prev) => [created, ...prev])
      setNewTache({
        description: '',
        commercial: '',
        echeance: '',
        statut: 'A faire',
      })
    } catch (err) {
      toast.error(err.message || 'Erreur inconnue')
    } finally {
      setSavingTache(false)
    }
  }

  function startEditTache(t) {
    setEditingTacheId(t._id || t.id)
    setEditingTache({
      description: t.description || '',
      commercial: t.commercial || '',
      echeance: t.echeance ? new Date(t.echeance).toISOString().split('T')[0] : '',
      statut: t.statut || 'A faire',
    })
  }

  async function handleSaveTache(id) {
    try {
      const res = await fetch(`${API_BASE}/api/taches/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingTache),
      })
      if (!res.ok) {
        throw new Error('Erreur lors de la mise à jour de la tâche')
      }
      const updated = await res.json()
      setTaches((prev) =>
        prev.map((t) => (t._id === updated._id ? updated : t))
      )
      setEditingTacheId(null)
    } catch (err) {
      toast.error(err.message || 'Erreur inconnue')
    }
  }

  async function handleDeleteTache(id) {
    try {
      const res = await fetch(`${API_BASE}/api/taches/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) {
        throw new Error('Erreur lors de la suppression de la tâche')
      }
      setTaches((prev) => prev.filter((t) => t._id !== id && t.id !== id))
    } catch (err) {
      toast.error(err.message || 'Erreur inconnue')
    }
  }

  async function handleAddVehicule(e) {
    e.preventDefault()
    if (!newVehicule.marque.trim() || !newVehicule.modele.trim()) return

    try {
      setSavingVehicule(true)
      const res = await fetch(`${API_BASE}/api/vehicules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newVehicule,
          annee: newVehicule.annee ? Number(newVehicule.annee) : undefined,
          prix: newVehicule.prix ? Number(newVehicule.prix) : undefined,
        }),
      })

      if (!res.ok) {
        throw new Error("Erreur lors de la création du véhicule")
      }

      const created = await res.json()
      setVehicules((prev) => [created, ...prev])
      setNewVehicule({
        marque: '',
        modele: '',
        annee: '',
        prix: '',
        statut: 'Disponible',
        localisation: '',
      })
    } catch (err) {
      toast.error(err.message || 'Erreur inconnue')
    } finally {
      setSavingVehicule(false)
    }
  }

  function startEditVehicule(v) {
    setEditingVehiculeId(v._id || v.id)
    setEditingVehicule({
      marque: v.marque || '',
      modele: v.modele || '',
      annee: v.annee ? String(v.annee) : '',
      prix: v.prix ? String(v.prix) : '',
      statut: v.statut || 'Disponible',
      localisation: v.localisation || '',
    })
  }

  async function handleSaveVehicule(id) {
    try {
      const res = await fetch(`${API_BASE}/api/vehicules/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...editingVehicule,
          annee: editingVehicule.annee ? Number(editingVehicule.annee) : undefined,
          prix: editingVehicule.prix ? Number(editingVehicule.prix) : undefined,
        }),
      })
      if (!res.ok) {
        throw new Error('Erreur lors de la mise à jour du véhicule')
      }
      const updated = await res.json()
      setVehicules((prev) =>
        prev.map((v) => (v._id === updated._id ? updated : v))
      )
      setEditingVehiculeId(null)
    } catch (err) {
      toast.error(err.message || 'Erreur inconnue')
    }
  }

  async function handleDeleteVehicule(id) {
    try {
      const res = await fetch(`${API_BASE}/api/vehicules/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) {
        throw new Error('Erreur lors de la suppression du véhicule')
      }
      setVehicules((prev) => prev.filter((v) => v._id !== id && v.id !== id))
    } catch (err) {
      toast.error(err.message || 'Erreur inconnue')
    }
  }

  async function handleAddDevis(e) {
    e.preventDefault()
    if (!newDevis.numero.trim() || !newDevis.client.trim()) return

    try {
      setSavingDevis(true)
      const res = await fetch(`${API_BASE}/api/devis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newDevis,
          montant: newDevis.montant ? Number(newDevis.montant) : undefined,
        }),
      })

      if (!res.ok) {
        throw new Error("Erreur lors de la création du devis")
      }

      const created = await res.json()
      // on n'affiche que les devis "En cours" dans le tableau
      if (created.statut === 'En cours') {
        setDevis((prev) => [created, ...prev])
      }
      // Mettre à jour aussi devisAll pour la page devis
      setDevisAll((prev) => [created, ...prev])
      setNewDevis({
        numero: '',
        client: '',
        vehicule: '',
        montant: '',
        statut: 'En cours',
      })
    } catch (err) {
      toast.error(err.message || 'Erreur inconnue')
    } finally {
      setSavingDevis(false)
    }
  }

  async function handleDeleteDevis(id) {
    try {
      const res = await fetch(`${API_BASE}/api/devis/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) {
        throw new Error('Erreur lors de la suppression du devis')
      }
      setDevis((prev) => prev.filter((d) => d._id !== id && d.id !== id))
      // Mettre à jour aussi devisAll pour la page devis
      setDevisAll((prev) => prev.filter((d) => d._id !== id && d.id !== id))
    } catch (err) {
      toast.error(err.message || 'Erreur inconnue')
    }
  }

  function openDevisModal(prospect = null) {
    setDevisEditId(null)
    const prospectId = prospect?._id || prospect?.id || ''
    setDevisFormComplet({
      prospectId: prospectId || '',
      numero: '',
      clientEntreprise: prospect ? [prospect.prenom, prospect.nom].filter(Boolean).join(' ') || prospect.email || '' : '',
      clientResponsable: prospect ? [prospect.prenom, prospect.nom].filter(Boolean).join(' ') : '',
      clientTelephone: prospect?.telephone || '',
      clientEmail: prospect?.email || '',
      objet: '',
      premierLoyer: '',
      mensualiteFixe: '',
      dureeMois: 48,
      optionAchat: '',
      inclus: '- Véhicule neuf (selon désignation)\n- Assurance TOUS RISQUES 4 ans (Partenaire AXA/SANLAM)\n- Tracker GPS avec coupe-circuit 24h/24\n- Gestion administrative complète (Carte grise, plaques, mise à la route)\n- Optimisation fiscale : loyers déductibles (selon CGI Gabon)',
      conditions: '- Durée : selon contrat\n- OVPI obligatoire à la signature\n- Réserve de propriété jusqu\'à levée d\'option\n- Conformité OHADA & CIMA',
      statut: 'En cours',
      tvaTaux: 18,
      montantHT: '',
    })
    setDevisModalOpen(true)
  }

  function openEditDevisComplet(d) {
    const inclusStr = Array.isArray(d.inclus) ? d.inclus.join('\n') : (d.inclus || '')
    const conditionsStr = Array.isArray(d.conditions) ? d.conditions.join('\n') : (d.conditions || '')
    setDevisEditId(d._id || d.id)
    const prospectId = d.prospectId?._id || d.prospectId || ''
    setDevisFormComplet({
      prospectId: prospectId || '',
      numero: d.numero || '',
      clientEntreprise: d.clientEntreprise || d.client || '',
      clientResponsable: d.clientResponsable || '',
      clientTelephone: d.clientTelephone || '',
      clientEmail: d.clientEmail || '',
      objet: d.objet || '',
      premierLoyer: d.premierLoyer != null ? String(d.premierLoyer) : '',
      mensualiteFixe: d.mensualiteFixe != null ? String(d.mensualiteFixe) : '',
      dureeMois: d.dureeMois ?? 48,
      optionAchat: d.optionAchat != null ? String(d.optionAchat) : '',
      inclus: inclusStr || '- Véhicule neuf (selon désignation)\n- Assurance TOUS RISQUES 4 ans (Partenaire AXA/SANLAM)\n- Tracker GPS avec coupe-circuit 24h/24\n- Gestion administrative complète (Carte grise, plaques, mise à la route)\n- Optimisation fiscale : loyers déductibles (selon CGI Gabon)',
      conditions: conditionsStr || '- Durée : selon contrat\n- OVPI obligatoire à la signature\n- Réserve de propriété jusqu\'à levée d\'option\n- Conformité OHADA & CIMA',
      statut: d.statut || 'En cours',
      tvaTaux: d.tvaTaux ?? 18,
      montantHT: d.montantHT != null ? String(d.montantHT) : '',
    })
    setDevisModalOpen(true)
  }

  async function handleSaveDevisComplet(e) {
    e.preventDefault()
    const f = devisFormComplet
    if (!f.clientEntreprise?.trim()) {
      toast.error('L\'entreprise client est obligatoire.')
      return
    }
    try {
      setSavingDevis(true)
      const montantHT = f.montantHT ? Number(f.montantHT) : null
      const tvaTaux = f.tvaTaux ? Number(f.tvaTaux) : 0
      const tvaMontant = montantHT && tvaTaux ? montantHT * tvaTaux / 100 : null
      const montantTTC = montantHT && tvaMontant != null ? montantHT + tvaMontant : null
      const inclusArr = f.inclus ? f.inclus.split('\n').map(s => s.trim()).filter(Boolean) : []
      const conditionsArr = f.conditions ? f.conditions.split('\n').map(s => s.trim()).filter(Boolean) : []
      const payload = {
        prospectId: f.prospectId || undefined,
        numero: f.numero?.trim() || undefined,
        clientEntreprise: f.clientEntreprise?.trim(),
        clientResponsable: f.clientResponsable?.trim(),
        clientTelephone: f.clientTelephone?.trim(),
        clientEmail: f.clientEmail?.trim(),
        objet: f.objet?.trim(),
        premierLoyer: f.premierLoyer ? Number(f.premierLoyer) : undefined,
        mensualiteFixe: f.mensualiteFixe ? Number(f.mensualiteFixe) : undefined,
        dureeMois: f.dureeMois ?? 48,
        optionAchat: f.optionAchat ? Number(f.optionAchat) : undefined,
        inclus: inclusArr.length ? inclusArr : undefined,
        conditions: conditionsArr.length ? conditionsArr : undefined,
        statut: f.statut || 'En cours',
        tvaTaux: tvaTaux || undefined,
        montantHT: montantHT || undefined,
        tvaMontant: tvaMontant || undefined,
        montantTTC: montantTTC || undefined,
      }
      if (devisEditId) {
        const res = await fetch(`${API_BASE}/api/devis/${devisEditId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Erreur lors de la mise à jour')
        const updated = await res.json()
        setDevisAll((prev) => prev.map((d) => (d._id === updated._id ? updated : d)))
        setDevis((prev) => prev.map((d) => (d._id === updated._id ? updated : d)))
        setDevisModalOpen(false)
        toast.success('Devis mis à jour')
      } else {
        const res = await fetch(`${API_BASE}/api/devis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Erreur lors de la création')
        const created = await res.json()
        setDevisAll((prev) => [created, ...prev])
        if (created.statut === 'En cours') setDevis((prev) => [created, ...prev])
        setDevisModalOpen(false)
        toast.success('Devis créé avec succès')
      }
    } catch (err) {
      toast.error(err.message || 'Erreur inconnue')
    } finally {
      setSavingDevis(false)
    }
  }

  async function handleDownloadDevisPDF(devisItem) {
    const id = devisItem?._id || devisItem?.id
    if (!id) {
      toast.error('Devis invalide.')
      return
    }
    if (!token) {
      toast.error('Vous devez être connecté pour télécharger le PDF.')
      return
    }
    try {
      const url = `${API_BASE}/api/devis/${String(id)}/pdf`
      const res = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
      const contentType = res.headers.get('Content-Type') || ''
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: res.statusText }))
        const msg = errData.detail ? `${errData.error}: ${errData.detail}` : (errData.error || `Erreur ${res.status}`)
        throw new Error(msg)
      }
      if (!contentType.includes('application/pdf')) {
        await res.text()
        throw new Error('Réponse invalide (vérifiez que le serveur backend tourne sur le port 4000).')
      }
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `DEVIS_CARWAZPLAN_${devisItem?.numero || id}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      let msg = err.message || 'Erreur lors du téléchargement du PDF'
      if (err.name === 'TypeError' || msg.includes('fetch') || msg.includes('Failed') || msg.includes('NetworkError')) {
        msg += '\n\nVérifiez que le backend est démarré (npm run dev → port 4000).'
      }
      toast.error(msg)
    }
  }

  // Interactions CRUD
  async function handleAddInteraction(e) {
    e.preventDefault()
    if (!newInteraction.type.trim() || !newInteraction.sujet.trim()) return

    try {
      setSavingInteraction(true)
      const res = await fetch(`${API_BASE}/api/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newInteraction),
      })

      if (!res.ok) {
        throw new Error('Erreur lors de la création de l\'interaction')
      }

      const created = await res.json()
      setInteractions((prev) => [created, ...prev])
      setNewInteraction({
        prospectId: '',
        date: new Date().toISOString().split('T')[0],
        type: 'Appel',
        sujet: '',
        contenu: '',
      })
    } catch (err) {
      toast.error(err.message || 'Erreur inconnue')
    } finally {
      setSavingInteraction(false)
    }
  }

  function startEditInteraction(i) {
    setEditingInteractionId(i._id || i.id)
    setEditingInteraction({
      prospectId: i.prospectId || '',
      date: i.date ? new Date(i.date).toISOString().split('T')[0] : '',
      type: i.type || 'Appel',
      sujet: i.sujet || '',
      contenu: i.contenu || '',
    })
  }

  async function handleSaveInteraction(id) {
    try {
      const res = await fetch(`${API_BASE}/api/interactions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingInteraction),
      })
      if (!res.ok) {
        throw new Error('Erreur lors de la mise à jour de l\'interaction')
      }
      const updated = await res.json()
      setInteractions((prev) =>
        prev.map((i) => (i._id === updated._id ? updated : i))
      )
      setEditingInteractionId(null)
    } catch (err) {
      toast.error(err.message || 'Erreur inconnue')
    }
  }

  async function handleDeleteInteraction(id) {
    try {
      const res = await fetch(`${API_BASE}/api/interactions/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) {
        throw new Error('Erreur lors de la suppression de l\'interaction')
      }
      setInteractions((prev) => prev.filter((i) => i._id !== id && i.id !== id))
    } catch (err) {
      toast.error(err.message || 'Erreur inconnue')
    }
  }

  // Factures CRUD
  async function handleAddFacture(e) {
    e.preventDefault()
    if (!newFacture.numero.trim() || !newFacture.client.trim()) return

    try {
      setSavingFacture(true)
      const res = await fetch(`${API_BASE}/api/factures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newFacture,
          montant: newFacture.montant ? Number(newFacture.montant) : undefined,
        }),
      })

      if (!res.ok) {
        throw new Error('Erreur lors de la création de la facture')
      }

      const created = await res.json()
      setFactures((prev) => [created, ...prev])
      setNewFacture({
        numero: '',
        devisId: '',
        client: '',
        montant: '',
        statut: 'Émise',
        dateEmission: new Date().toISOString().split('T')[0],
        dateEcheance: '',
      })
    } catch (err) {
      toast.error(err.message || 'Erreur inconnue')
    } finally {
      setSavingFacture(false)
    }
  }

  function startEditFacture(f) {
    setEditingFactureId(f._id || f.id)
    setEditingFacture({
      numero: f.numero || '',
      devisId: f.devisId || '',
      client: f.client || '',
      montant: f.montant ? String(f.montant) : '',
      statut: f.statut || 'Émise',
      dateEmission: f.dateEmission
        ? new Date(f.dateEmission).toISOString().split('T')[0]
        : '',
      dateEcheance: f.dateEcheance
        ? new Date(f.dateEcheance).toISOString().split('T')[0]
        : '',
    })
  }

  async function handleSaveFacture(id) {
    try {
      const res = await fetch(`${API_BASE}/api/factures/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...editingFacture,
          montant: editingFacture.montant ? Number(editingFacture.montant) : undefined,
        }),
      })
      if (!res.ok) {
        throw new Error('Erreur lors de la mise à jour de la facture')
      }
      const updated = await res.json()
      setFactures((prev) =>
        prev.map((f) => (f._id === updated._id ? updated : f))
      )
      setEditingFactureId(null)
    } catch (err) {
      toast.error(err.message || 'Erreur inconnue')
    }
  }

  async function handleDeleteFacture(id) {
    try {
      const res = await fetch(`${API_BASE}/api/factures/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) {
        throw new Error('Erreur lors de la suppression de la facture')
      }
      setFactures((prev) => prev.filter((f) => f._id !== id && f.id !== id))
    } catch (err) {
      toast.error(err.message || 'Erreur inconnue')
    }
  }

  // Relances Emails CRUD
  async function handleAddRelanceEmail(e) {
    e.preventDefault()
    if (!newRelanceEmail.nom.trim() || !newRelanceEmail.sujet.trim()) return

    try {
      setSavingRelanceEmail(true)
      const res = await fetch(`${API_BASE}/api/relances-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newRelanceEmail,
          sequence: Number(newRelanceEmail.sequence) || 0,
        }),
      })

      if (!res.ok) {
        throw new Error('Erreur lors de la création du modèle de relance')
      }

      const created = await res.json()
      setRelancesEmails((prev) => [created, ...prev])
      setNewRelanceEmail({
        nom: '',
        sujet: '',
        corps: '',
        sequence: 0,
      })
    } catch (err) {
      toast.error(err.message || 'Erreur inconnue')
    } finally {
      setSavingRelanceEmail(false)
    }
  }

  function startEditRelanceEmail(r) {
    setEditingRelanceEmailId(r._id || r.id)
    setEditingRelanceEmail({
      nom: r.nom || '',
      sujet: r.sujet || '',
      corps: r.corps || '',
      sequence: r.sequence || 0,
    })
  }

  async function handleSaveRelanceEmail(id) {
    try {
      const res = await fetch(`${API_BASE}/api/relances-emails/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...editingRelanceEmail,
          sequence: Number(editingRelanceEmail.sequence) || 0,
        }),
      })
      if (!res.ok) {
        throw new Error('Erreur lors de la mise à jour du modèle de relance')
      }
      const updated = await res.json()
      setRelancesEmails((prev) =>
        prev.map((r) => (r._id === updated._id ? updated : r))
      )
      setEditingRelanceEmailId(null)
    } catch (err) {
      toast.error(err.message || 'Erreur inconnue')
    }
  }

  async function handleDeleteRelanceEmail(id) {
    try {
      const res = await fetch(`${API_BASE}/api/relances-emails/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) {
        throw new Error('Erreur lors de la suppression du modèle de relance')
      }
      setRelancesEmails((prev) => prev.filter((r) => r._id !== id && r.id !== id))
    } catch (err) {
      toast.error(err.message || 'Erreur inconnue')
    }
  }

  async function handleAddBanque(e) {
    e.preventDefault()
    if (!newBanque.nom?.trim()) return
    try {
      setSavingBanque(true)
      const res = await fetch(`${API_BASE}/api/banques`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nom: newBanque.nom,
          tauxMin: Number(newBanque.tauxMin) || undefined,
          tauxMax: Number(newBanque.tauxMax) || undefined,
          apportMinPourcent: Number(newBanque.apportMinPourcent) || 20,
          dureeMaxMois: Number(newBanque.dureeMaxMois) || 60,
        }),
      })
      if (!res.ok) throw new Error('Erreur lors de l\'ajout')
      const created = await res.json()
      setBanques((prev) => [created, ...prev])
      setNewBanque({ nom: '', tauxMin: '', tauxMax: '', apportMinPourcent: 20, dureeMaxMois: 60 })
    } catch (err) {
      toast.error(err.message || 'Erreur inconnue')
    } finally {
      setSavingBanque(false)
    }
  }

  function startEditBanque(b) {
    setEditingBanqueId(b._id || b.id)
    setEditingBanque({
      nom: b.nom || '',
      tauxMin: b.tauxMin ?? '',
      tauxMax: b.tauxMax ?? '',
      apportMinPourcent: b.apportMinPourcent ?? 20,
      dureeMaxMois: b.dureeMaxMois ?? 60,
    })
  }

  async function handleSaveBanque(id) {
    try {
      const res = await fetch(`${API_BASE}/api/banques/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...editingBanque,
          tauxMin: Number(editingBanque.tauxMin) || undefined,
          tauxMax: Number(editingBanque.tauxMax) || undefined,
          apportMinPourcent: Number(editingBanque.apportMinPourcent) || 20,
          dureeMaxMois: Number(editingBanque.dureeMaxMois) || 60,
        }),
      })
      if (!res.ok) throw new Error('Erreur lors de la mise à jour')
      const updated = await res.json()
      setBanques((prev) => prev.map((b) => (b._id === updated._id ? updated : b)))
      setEditingBanqueId(null)
    } catch (err) {
      toast.error(err.message || 'Erreur inconnue')
    }
  }

  async function handleDeleteBanque(id) {
    try {
      const res = await fetch(`${API_BASE}/api/banques/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Erreur lors de la suppression')
      setBanques((prev) => prev.filter((b) => b._id !== id && b.id !== id))
    } catch (err) {
      toast.error(err.message || 'Erreur inconnue')
    }
  }

  // Users (pour page Paramètres)
  async function handleUpdateUserRole(userId, newRole) {
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) {
        throw new Error('Erreur lors de la mise à jour du rôle')
      }
      const updated = await res.json()
      setUsers((prev) =>
        prev.map((u) => (u._id === updated._id ? updated : u))
      )
    } catch (err) {
      toast.error(err.message || 'Erreur inconnue')
    }
  }

  async function handleDeleteUser(userId) {
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Erreur lors de la suppression')
      }
      setUsers((prev) => prev.filter((u) => u._id !== userId && u.id !== userId))
    } catch (err) {
      toast.error(err.message || 'Erreur inconnue')
    }
  }

  function handleLogout() {
    localStorage.removeItem('token')
    setToken('')
    setCurrentUser(null)
  }

  async function handleUpdateProfileImage(file) {
    if (!file || !(file instanceof File)) return
    try {
      if (file.size > 1024 * 1024) {
        toast.warning('Image trop grande. Choisissez une image de moins de 1 Mo.')
        return
      }
      const formData = new FormData()
      formData.append('photo', file)
      const res = await fetch(`${API_BASE}/api/auth/me/photo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la mise à jour')
      setCurrentUser(data)
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la mise à jour de la photo')
    }
  }

  async function handleUpdateProfile() {
    try {
      setSavingProfil(true)
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nom: profilNom.trim(),
          prenom: profilPrenom.trim(),
          departement: profilDepartement.trim() || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la mise à jour')
      setCurrentUser(data)
      toast.success('Profil mis à jour')
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la mise à jour du profil')
    } finally {
      setSavingProfil(false)
    }
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim())
  }

  // Fonctions de filtrage avec useMemo
  const filteredProspects = useMemo(() => {
    return prospects.filter((p) => {
      const matchSearch =
        !debouncedSearchProspects ||
        `${p.idContact || ''} ${p.nom} ${p.prenom} ${p.email} ${p.telephone} ${p.ville || ''}`.toLowerCase().includes(debouncedSearchProspects.toLowerCase())
      const matchStatut = !filterProspectsStatut || p.statut === filterProspectsStatut
      const matchDossier = !filterProspectsDossier || p.statutDossier === filterProspectsDossier
      return matchSearch && matchStatut && matchDossier
    })
  }, [prospects, debouncedSearchProspects, filterProspectsStatut, filterProspectsDossier])

  // Catalogue : résultats directs + modèles similaires (même marque ou correspondance partielle)
  const { catalogueDirect, catalogueSimilar } = useMemo(() => {
    const matchStatut = (v) => !filterCatalogueStatut || v.statut === filterCatalogueStatut
    const base = vehicules.filter(matchStatut)

    if (!searchCatalogue.trim()) {
      return { catalogueDirect: base, catalogueSimilar: [] }
    }

    const searchLower = searchCatalogue.toLowerCase().trim()
    const searchWords = searchLower.split(/\s+/).filter(Boolean)

    const direct = base.filter((v) => {
      const full = `${v.marque || ''} ${v.modele || ''}`.toLowerCase()
      return full.includes(searchLower) || searchWords.every((w) => full.includes(w))
    })

    const marquesFromDirect = [...new Set(direct.map((v) => (v.marque || '').toLowerCase()).filter(Boolean))]
    const similar = base.filter((v) => {
      if (direct.some((d) => (d._id || d.id) === (v._id || v.id))) return false
      const full = `${v.marque || ''} ${v.modele || ''}`.toLowerCase()
      const sameMarque = marquesFromDirect.length && marquesFromDirect.includes((v.marque || '').toLowerCase())
      const partialMatch = searchWords.some((w) => full.includes(w))
      return sameMarque || partialMatch
    })

    return { catalogueDirect: direct, catalogueSimilar: similar }
  }, [vehicules, searchCatalogue, filterCatalogueStatut])

  const filteredTaches = useMemo(() => {
    return taches.filter((t) => {
      const matchSearch =
        !debouncedSearchTaches ||
        `${t.description} ${t.commercial} ${t.statut}`.toLowerCase().includes(debouncedSearchTaches.toLowerCase())
      const matchStatut = !filterTachesStatut || t.statut === filterTachesStatut
      return matchSearch && matchStatut
    })
  }, [taches, debouncedSearchTaches, filterTachesStatut])

  const filteredVehicules = useMemo(() => {
    return vehicules.filter((v) => {
      const matchSearch =
        !searchVehicules ||
        `${v.marque} ${v.modele} ${v.localisation}`.toLowerCase().includes(searchVehicules.toLowerCase())
      const matchStatut = !filterVehiculesStatut || v.statut === filterVehiculesStatut
      return matchSearch && matchStatut
    })
  }, [vehicules, searchVehicules, filterVehiculesStatut])

  const filteredDevis = useMemo(() => {
    return devisAll.filter((d) => {
      const matchSearch =
        !debouncedSearchDevis ||
        `${d.numero} ${d.client} ${d.vehicule}`.toLowerCase().includes(debouncedSearchDevis.toLowerCase())
      const matchStatut = !filterDevisStatut || d.statut === filterDevisStatut
      return matchSearch && matchStatut
    })
  }, [devisAll, debouncedSearchDevis, filterDevisStatut])

  const filteredInteractions = useMemo(() => {
    return interactions.filter((i) => {
      const matchSearch =
        !searchInteractions ||
        `${i.type} ${i.sujet} ${i.contenu}`.toLowerCase().includes(searchInteractions.toLowerCase())
      const matchType = !filterInteractionsType || i.type === filterInteractionsType
      return matchSearch && matchType
    })
  }, [interactions, searchInteractions, filterInteractionsType])

  const filteredFactures = useMemo(() => {
    return factures.filter((f) => {
      const matchSearch =
        !debouncedSearchFactures ||
        `${f.numero} ${f.client}`.toLowerCase().includes(debouncedSearchFactures.toLowerCase())
      const matchStatut = !filterFacturesStatut || f.statut === filterFacturesStatut
      return matchSearch && matchStatut
    })
  }, [factures, debouncedSearchFactures, filterFacturesStatut])

  // Fonctions d'export
  function handleExportDevisPDF() {
    exportToPDF(
      'Liste des Devis',
      [
        { key: 'numero', label: 'N° Devis' },
        { key: 'client', label: 'Client' },
        { key: 'vehicule', label: 'Véhicule' },
        { key: 'montant', label: 'Montant' },
        { key: 'statut', label: 'Statut' },
      ],
      filteredDevis.map((d) => ({
        numero: d.numero || '',
        client: d.client || '',
        vehicule: d.vehicule || '',
        montant: d.montant ? `${d.montant.toLocaleString('fr-FR')} FCFA` : '',
        statut: d.statut || '',
      })),
      'devis.pdf'
    )
  }

  function handleExportDevisExcel() {
    exportToCSV(
      filteredDevis.map((d) => ({
        numero: d.numero || '',
        client: d.client || '',
        vehicule: d.vehicule || '',
        montant: d.montant || '',
        statut: d.statut || '',
      })),
      'devis.csv',
      ['numero', 'client', 'vehicule', 'montant', 'statut']
    )
  }

  function handleExportFacturePDF() {
    exportToPDF(
      'Liste des Factures',
      [
        { key: 'numero', label: 'N° Facture' },
        { key: 'client', label: 'Client' },
        { key: 'montant', label: 'Montant' },
        { key: 'dateEmission', label: 'Date émission' },
        { key: 'dateEcheance', label: 'Date échéance' },
        { key: 'statut', label: 'Statut' },
      ],
      filteredFactures.map((f) => ({
        numero: f.numero || '',
        client: f.client || '',
        montant: f.montant ? `${f.montant.toLocaleString('fr-FR')} FCFA` : '',
        dateEmission: f.dateEmission
          ? new Date(f.dateEmission).toLocaleDateString('fr-FR')
          : '',
        dateEcheance: f.dateEcheance
          ? new Date(f.dateEcheance).toLocaleDateString('fr-FR')
          : '',
        statut: f.statut || '',
      })),
      'factures.pdf'
    )
  }

  function handleExportFactureExcel() {
    exportToCSV(
      filteredFactures.map((f) => ({
        numero: f.numero || '',
        client: f.client || '',
        montant: f.montant || '',
        dateEmission: f.dateEmission
          ? new Date(f.dateEmission).toLocaleDateString('fr-FR')
          : '',
        dateEcheance: f.dateEcheance
          ? new Date(f.dateEcheance).toLocaleDateString('fr-FR')
          : '',
        statut: f.statut || '',
      })),
      'factures.csv',
      ['numero', 'client', 'montant', 'dateEmission', 'dateEcheance', 'statut']
    )
  }

  async function handleLogin(e) {
    e.preventDefault()
    setAuthError('')
    setRegisterSuccess('')
    if (!isValidEmail(authEmail)) {
      setAuthError('Veuillez entrer une adresse email valide.')
      return
    }
    try {
      if (rememberMe) {
        localStorage.setItem('remember_email', authEmail)
      } else {
        localStorage.removeItem('remember_email')
      }
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Identifiants invalides')
      }
      const data = await res.json()
      setToken(data.token)
      localStorage.setItem('token', data.token)
      setAuthPassword('')
    } catch (err) {
      setAuthError(err.message || 'Erreur de connexion')
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setAuthError('')
    setRegisterSuccess('')

    if (!isValidEmail(registerData.email)) {
      setAuthError('Veuillez entrer une adresse email valide.')
      return
    }

    if (registerData.password !== registerData.confirmPassword) {
      setAuthError('Les mots de passe ne correspondent pas')
      return
    }

    if (registerData.password.length < 6) {
      setAuthError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password,
          role: registerData.role,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Erreur lors de l'inscription")
      }
      setRegisterSuccess('Compte créé avec succès ! Vous pouvez maintenant vous connecter.')
      setRegisterData({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user',
      })
      setIsRegisterMode(false)
    } catch (err) {
      setAuthError(err.message || "Erreur lors de l'inscription")
    }
  }

  if (!token) {
    return (
      <div className="auth-root">
        <div className="auth-container">
          <div className="auth-welcome">
            <div className="auth-welcome-shapes" />
            <div className="auth-welcome-content">
              <h2>BIENVENUE</h2>
              <p className="auth-welcome-title">CRM CarWazPlan</p>
              <p className="auth-welcome-desc">
                Gérez vos prospects, devis et véhicules en toute simplicité.
              </p>
            </div>
          </div>
          <div className="auth-form-section">
            <h1>{isRegisterMode ? 'Inscription' : 'Connexion'}</h1>
            <p className="auth-form-subtitle">
              {isRegisterMode ? 'Créez votre compte pour accéder au CRM.' : 'Connectez-vous pour accéder à votre espace.'}
            </p>
            {isRegisterMode ? (
              <form onSubmit={handleRegister} className="auth-form">
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden>✉</span>
                  <input
                    type="email"
                    placeholder="Email"
                    value={registerData.email}
                    onChange={(e) =>
                      setRegisterData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon auth-icon-lock" aria-hidden>🔐</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mot de passe"
                    value={registerData.password}
                    onChange={(e) =>
                      setRegisterData((prev) => ({ ...prev, password: e.target.value }))
                    }
                    required
                  />
                  <button type="button" className="auth-show-pwd" onClick={() => setShowPassword((s) => !s)}>
                    {showPassword ? 'Masquer' : 'Afficher'}
                  </button>
                </div>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon auth-icon-lock" aria-hidden>🔐</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirmer le mot de passe"
                    value={registerData.confirmPassword}
                    onChange={(e) =>
                      setRegisterData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                    }
                    required
                  />
                </div>
                <select
                  value={registerData.role}
                  onChange={(e) =>
                    setRegisterData((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className="auth-select"
                >
                  <option value="user">Utilisateur</option>
                  <option value="admin">Administrateur</option>
                </select>
                {authError && <p className="auth-error">{authError}</p>}
                {registerSuccess && <p className="auth-success">{registerSuccess}</p>}
                <button type="submit" className="auth-btn-primary">S&apos;inscrire</button>
                <div className="auth-divider">ou</div>
                <a href={`${API_BASE}/api/auth/google`} className="auth-btn-google">
                  <span className="auth-google-icon">G</span>
                  S&apos;inscrire avec Google
                </a>
                <button type="button" className="auth-toggle" onClick={() => { setIsRegisterMode(false); setAuthError(''); setRegisterSuccess(''); }}>
                  Déjà un compte ? Se connecter
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="auth-form">
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden>✉</span>
                  <input
                    type="email"
                    placeholder="Email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon auth-icon-lock" aria-hidden>🔐</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mot de passe"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                  />
                  <button type="button" className="auth-show-pwd" onClick={() => setShowPassword((s) => !s)}>
                    {showPassword ? 'Masquer' : 'Afficher'}
                  </button>
                </div>
                <div className="auth-form-options">
                  <label className="auth-checkbox">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    <span>Se souvenir de moi</span>
                  </label>
                  <button type="button" className="auth-forgot" onClick={() => toast('Fonctionnalité à venir')}>
                    Mot de passe oublié ?
                  </button>
                </div>
                {authError && <p className="auth-error">{authError}</p>}
                {registerSuccess && <p className="auth-success">{registerSuccess}</p>}
                <button type="submit" className="auth-btn-primary">Se connecter</button>
                <div className="auth-divider">ou</div>
                <a href={`${API_BASE}/api/auth/google`} className="auth-btn-google">
                  <span className="auth-google-icon">G</span>
                  Se connecter avec Google
                </a>
                <button type="button" className="auth-toggle" onClick={() => { setIsRegisterMode(true); setAuthError(''); setRegisterSuccess(''); }}>
                  Pas encore de compte ? S&apos;inscrire
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-root">
      <div
        className={`sidebar-overlay ${sidebarOpen ? '' : 'hidden'}`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <span className="logo-icon">C</span>
          <span className="logo-text">CarWazPlan</span>
        </div>

        <button className="btn-upload" onClick={() => setActiveMenu('prospects')}>
          Nouveau contact
        </button>

        <nav className="sidebar-nav">
          <p className="sidebar-title">Navigation</p>
          <ul>
            <li
              className={`nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('dashboard')
                setSidebarOpen(false)
              }}
            >
              Dashboard
            </li>
            <li
              className={`nav-item ${activeMenu === 'prospects' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('prospects')
                setSidebarOpen(false)
              }}
            >
              Prospects / Clients
            </li>
            <li
              className={`nav-item ${activeMenu === 'interactions' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('interactions')
                setSidebarOpen(false)
              }}
            >
              Interactions
            </li>
            <li
              className={`nav-item ${activeMenu === 'taches' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('taches')
                setSidebarOpen(false)
              }}
            >
              Tâches
            </li>
            <li
              className={`nav-item ${activeMenu === 'vehicules' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('vehicules')
                setSidebarOpen(false)
              }}
            >
              Stock véhicules
            </li>
            <li
              className={`nav-item ${activeMenu === 'devis' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('devis')
                setSidebarOpen(false)
              }}
            >
              Devis
            </li>
            <li className="nav-item nav-item-external">
              <a
                href="https://wazcar-plan-simulator.onrender.com"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link-external"
                onClick={() => setSidebarOpen(false)}
              >
                Simulations
              </a>
            </li>
            <li
              className={`nav-item ${activeMenu === 'factures' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('factures')
                setSidebarOpen(false)
              }}
            >
              Factures
            </li>
            <li
              className={`nav-item ${activeMenu === 'relances-emails' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('relances-emails')
                setSidebarOpen(false)
              }}
            >
              Relances emails
            </li>
            <li
              className={`nav-item ${activeMenu === 'banques' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('banques')
                setSidebarOpen(false)
              }}
            >
              Banques partenaires
            </li>
            <li
              className={`nav-item ${activeMenu === 'parametres' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('parametres')
                setSidebarOpen(false)
              }}
            >
              Paramètres
            </li>
          </ul>
        </nav>

        <div className="sidebar-storage">
          <p className="sidebar-title">Stock / stockage</p>
          <div className="storage-bar">
            <div className="storage-bar-fill" />
          </div>
          <p className="storage-text">
            {stats
              ? `${stats.stock.disponibles} dispo • ${stats.stock.reserves} réservés • ${stats.stock.vendus} vendus`
              : 'Chargement du stock...'}
          </p>
          <button className="btn-upgrade">Gérer le stock</button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button
            className="mobile-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <div className="topbar-left">
            <p className="topbar-welcome">
              Bienvenue, {[currentUser?.prenom, currentUser?.nom].filter(Boolean).join(' ') || currentUser?.email || 'Utilisateur'} 👋
            </p>
            <h1>
              {activeMenu === 'dashboard'
                ? 'Dashboard'
                : activeMenu === 'prospects'
                ? 'Prospects / Clients'
                : activeMenu === 'interactions'
                ? 'Interactions'
                : activeMenu === 'taches'
                ? 'Tâches'
                : activeMenu === 'vehicules'
                ? 'Stock véhicules'
                : activeMenu === 'devis'
                ? 'Devis'
                : activeMenu === 'factures'
                ? 'Factures'
                : activeMenu === 'relances-emails'
                ? 'Relances emails'
                : activeMenu === 'banques'
                ? 'Banques partenaires'
                : activeMenu === 'parametres'
                ? 'Paramètres'
                : 'CRM CarWazPlan'}
            </h1>
          </div>
          <div className="topbar-right">
            <div
              className="user-badge"
              title={[currentUser?.prenom, currentUser?.nom].filter(Boolean).join(' ') || currentUser?.email}
            >
              {currentUser?.profileImage ? (
                <img src={currentUser.profileImage} alt="Profil" className="user-badge-img" />
              ) : (
                (currentUser?.prenom || currentUser?.nom || currentUser?.email || 'U').charAt(0).toUpperCase()
              )}
            </div>
          </div>
        </header>

        {activeMenu === 'dashboard' && (
          <>
            <section className="quick-access">
              <h2>Indicateurs clés</h2>
              <div className="quick-cards">
                <div className="quick-card">
                  <p className="quick-label">Pipeline commercial</p>
                  <p className="quick-folder">
                    {stats ? `${(stats.kpi.pipelineCommercial || 0).toLocaleString('fr-FR')} FCFA` : '...'}
                  </p>
                </div>
                <div className="quick-card">
                  <p className="quick-label">Taux de transformation</p>
                  <p className="quick-folder">
                    {stats ? `${stats.kpi.tauxTransformation || 0}%` : '...'}
                  </p>
                </div>
                <div className="quick-card">
                  <p className="quick-label">Relances urgentes</p>
                  <p className="quick-folder">
                    {stats ? stats.kpi.relancesUrgentes : '...'}
                  </p>
                </div>
                <div className="quick-card">
                  <p className="quick-label">CA total</p>
                  <p className="quick-folder">
                    {stats ? `${(stats.kpi.ca || 0).toLocaleString('fr-FR')} FCFA` : '...'}
                  </p>
                </div>
              </div>
            </section>

            <section className="dashboard-stats-section">
              <div className="dashboard-stats-grid">
                <div className="dashboard-stats-chart">
                  <h2>Statistiques — Prospects & Devis (30 derniers jours)</h2>
                  <DashboardChart data={chartData} loading={loading} />
                </div>
                <div className="dashboard-stats-calendar">
                  <h2>Calendrier</h2>
                  <DashboardCalendar chartData={chartData} taches={taches} />
                </div>
              </div>
            </section>

            {prospects.filter((p) => {
              if (!p.prochaineRelance) return false
              const d = new Date(p.prochaineRelance)
              const today = new Date()
              return d.toDateString() === today.toDateString()
            }).length > 0 && (
              <section className="files-section">
                <div className="files-header">
                  <h2>Planning relances — Aujourd&apos;hui</h2>
                </div>
                <div className="planning-relances">
                  {prospects
                    .filter((p) => {
                      if (!p.prochaineRelance) return false
                      const d = new Date(p.prochaineRelance)
                      const today = new Date()
                      return d.toDateString() === today.toDateString()
                    })
                    .map((p) => (
                      <div key={p._id || p.id} className="planning-card planning-urgent">
                        <span className="planning-nom">{[p.prenom, p.nom].filter(Boolean).join(' ')}</span>
                        <span className="planning-contact">{p.telephone || p.email}</span>
                        <span className="planning-priorite">{p.priorite || '—'}</span>
                        <span className="planning-dossier">{p.statutDossier || '—'}</span>
                      </div>
                    ))}
                </div>
              </section>
            )}

            <section className="files-section">
              <div className="files-header">
                <h2>Devis en cours</h2>
                <button type="button" className="btn-upload" onClick={openDevisModal}>
                  Nouveau devis complet
                </button>
              </div>
              <form className="inline-form" onSubmit={handleAddDevis}>
                <input
                  type="text"
                  placeholder="N° devis"
                  value={newDevis.numero}
                  onChange={(e) =>
                    setNewDevis((d) => ({ ...d, numero: e.target.value }))
                  }
                />
                <input
                  type="text"
                  placeholder="Client"
                  value={newDevis.client}
                  onChange={(e) =>
                    setNewDevis((d) => ({ ...d, client: e.target.value }))
                  }
                />
                <input
                  type="text"
                  placeholder="Véhicule"
                  value={newDevis.vehicule}
                  onChange={(e) =>
                    setNewDevis((d) => ({ ...d, vehicule: e.target.value }))
                  }
                />
                <input
                  type="number"
                  placeholder="Montant (FCFA)"
                  value={newDevis.montant}
                  onChange={(e) =>
                    setNewDevis((d) => ({ ...d, montant: e.target.value }))
                  }
                />
                <button type="submit" disabled={savingDevis}>
                  {savingDevis ? 'Enregistrement...' : 'Ajouter'}
                </button>
              </form>
              <div className="files-table">
                <div className="files-row files-row-head">
                  <span>N° Devis</span>
                  <span>Prospect / Client</span>
                  <span>Véhicule</span>
                  <span>Montant</span>
                  <span>Actions</span>
                </div>
                {loading && (
                  <div className="files-row">
                    <span>Chargement...</span>
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                )}
                {error && !loading && (
                  <div className="files-row">
                    <span>{error}</span>
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                )}
                {!loading &&
                  !error &&
                  devis.map((d) => (
                    <div className="files-row" key={d._id || d.id}>
                      <span>{d.numero}</span>
                      <span>{d.clientEntreprise || d.client}</span>
                      <span>{d.objet || d.vehicule}</span>
                      <span>{(d.montant != null ? d.montant : 0).toLocaleString('fr-FR')} FCFA</span>
                      <span className="actions-cell">
                        <button
                          type="button"
                          onClick={() => handleDownloadDevisPDF(d)}
                        >
                          Générer PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditDevisComplet(d)}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => confirm({ title: 'Supprimer ce devis', message: 'Êtes-vous sûr de vouloir supprimer ce devis ?', onConfirm: () => handleDeleteDevis(d._id || d.id) })}
                        >
                          Supprimer
                        </button>
                      </span>
                    </div>
                  ))}
              </div>
            </section>
          </>
        )}

        {activeMenu === 'prospects' && (
          <section className="files-section">
            <div className="files-header">
              <h2>Prospects / Clients</h2>
              <div className="subview-tabs">
                <button
                  type="button"
                  className={`subview-tab ${prospectsSubview === 'liste' ? 'active' : ''}`}
                  onClick={() => setProspectsSubview('liste')}
                >
                  Liste prospects
                </button>
                <button
                  type="button"
                  className={`subview-tab ${prospectsSubview === 'catalogue' ? 'active' : ''}`}
                  onClick={() => setProspectsSubview('catalogue')}
                >
                  Catalogue
                </button>
              </div>
            </div>

            {prospectsSubview === 'liste' && (
              <>
            <div className="filters-bar">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchProspects}
                onChange={(e) => setSearchProspects(e.target.value)}
              />
              <select
                value={filterProspectsStatut}
                onChange={(e) => setFilterProspectsStatut(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                <option value="Prospect">Prospect</option>
                <option value="Client">Client</option>
                <option value="Ancien client">Ancien client</option>
              </select>
              <select
                value={filterProspectsDossier}
                onChange={(e) => setFilterProspectsDossier(e.target.value)}
              >
                <option value="">Tous les dossiers</option>
                <option value="Nouveau Contact">Nouveau Contact</option>
                <option value="En Cours">En Cours</option>
                <option value="Documents Manquants">Documents Manquants</option>
                <option value="Soumis Banque">Soumis Banque</option>
                <option value="Approuvé">Approuvé</option>
                <option value="Finalisé">Finalisé</option>
              </select>
            </div>
            <form className="prospect-form prospect-form-extended" onSubmit={handleAddProspect}>
              <input
                type="text"
                placeholder="Prénom"
                value={newProspect.prenom}
                onChange={(e) =>
                  setNewProspect((p) => ({ ...p, prenom: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Nom"
                value={newProspect.nom}
                onChange={(e) =>
                  setNewProspect((p) => ({ ...p, nom: e.target.value }))
                }
              />
              <input
                type="email"
                placeholder="Email"
                value={newProspect.email}
                onChange={(e) =>
                  setNewProspect((p) => ({ ...p, email: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Téléphone (+241...)"
                value={newProspect.telephone}
                onChange={(e) =>
                  setNewProspect((p) => ({ ...p, telephone: e.target.value }))
                }
              />
              <select
                value={newProspect.ville}
                onChange={(e) =>
                  setNewProspect((p) => ({ ...p, ville: e.target.value }))
                }
              >
                <option value="">Ville</option>
                <option value="Libreville">Libreville</option>
                <option value="Port-Gentil">Port-Gentil</option>
                <option value="Franceville">Franceville</option>
                <option value="Lambaréné">Lambaréné</option>
                <option value="Autre">Autre</option>
              </select>
              <input
                type="number"
                placeholder="Revenu mensuel (FCFA)"
                value={newProspect.revenuMensuel}
                onChange={(e) =>
                  setNewProspect((p) => ({ ...p, revenuMensuel: e.target.value }))
                }
              />
              <select
                value={newProspect.typeVehicule}
                onChange={(e) =>
                  setNewProspect((p) => ({ ...p, typeVehicule: e.target.value }))
                }
              >
                <option value="Neuf">Neuf</option>
                <option value="Occasion">Occasion</option>
                <option value="Utilitaire">Utilitaire</option>
              </select>
              <input
                type="number"
                placeholder="Budget (FCFA)"
                value={newProspect.budgetClient}
                onChange={(e) =>
                  setNewProspect((p) => ({ ...p, budgetClient: e.target.value }))
                }
              />
              <input
                type="number"
                placeholder="Apport (FCFA)"
                value={newProspect.apportInitial}
                onChange={(e) =>
                  setNewProspect((p) => ({ ...p, apportInitial: e.target.value }))
                }
              />
              <select
                value={newProspect.dureeFinancement}
                onChange={(e) =>
                  setNewProspect((p) => ({ ...p, dureeFinancement: Number(e.target.value) }))
                }
              >
                <option value={12}>12 mois</option>
                <option value={24}>24 mois</option>
                <option value={36}>36 mois</option>
                <option value={48}>48 mois</option>
                <option value={60}>60 mois</option>
                <option value={72}>72 mois</option>
              </select>
              <select
                value={newProspect.statut}
                onChange={(e) =>
                  setNewProspect((p) => ({ ...p, statut: e.target.value }))
                }
              >
                <option value="Prospect">Prospect</option>
                <option value="Client">Client</option>
                <option value="Ancien client">Ancien client</option>
              </select>
              <select
                value={newProspect.statutDossier}
                onChange={(e) =>
                  setNewProspect((p) => ({ ...p, statutDossier: e.target.value }))
                }
              >
                <option value="Nouveau Contact">Nouveau Contact</option>
                <option value="En Cours">En Cours</option>
                <option value="Documents Manquants">Documents Manquants</option>
                <option value="Soumis Banque">Soumis Banque</option>
                <option value="Approuvé">Approuvé</option>
                <option value="Finalisé">Finalisé</option>
              </select>
              <button type="submit" disabled={savingProspect}>
                {savingProspect ? 'Enregistrement...' : 'Ajouter'}
              </button>
            </form>
            <div className="files-table">
              <div className="files-row files-row-head">
                <span>ID</span>
                <span>Nom</span>
                <span>Email</span>
                <span>Téléphone</span>
                <span>Score</span>
                <span>Priorité</span>
                <span>Dossier</span>
                <span>Prochaine relance</span>
                <span>Actions</span>
              </div>
              {loading && (
                <div className="files-row">
                  <span>Chargement...</span>
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              )}
              {error && !loading && (
                <div className="files-row">
                  <span>{error}</span>
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              )}
              {!loading &&
                !error &&
                filteredProspects.map((p) => (
                  <div className="files-row" key={p._id || p.id}>
                    {editingProspectId === (p._id || p.id) ? (
                      <>
                        <span>{p.idContact || '—'}</span>
                        <span>
                          <input className="cell-input" value={editingProspect.prenom} onChange={(e) => setEditingProspect((prev) => ({ ...prev, prenom: e.target.value }))} placeholder="Prénom" />
                          <input className="cell-input" value={editingProspect.nom} onChange={(e) => setEditingProspect((prev) => ({ ...prev, nom: e.target.value }))} placeholder="Nom" />
                        </span>
                        <span><input className="cell-input" value={editingProspect.email} onChange={(e) => setEditingProspect((prev) => ({ ...prev, email: e.target.value }))} placeholder="Email" /></span>
                        <span><input className="cell-input" value={editingProspect.telephone} onChange={(e) => setEditingProspect((prev) => ({ ...prev, telephone: e.target.value }))} placeholder="Tél" /></span>
                        <span>{p.scoreEligibilite ?? '—'}</span>
                        <span>{p.priorite || '—'}</span>
                        <span>
                          <select className="cell-input" value={editingProspect.statutDossier} onChange={(e) => setEditingProspect((prev) => ({ ...prev, statutDossier: e.target.value }))}>
                            <option value="Nouveau Contact">Nouveau</option>
                            <option value="En Cours">En Cours</option>
                            <option value="Documents Manquants">Doc. manquants</option>
                            <option value="Soumis Banque">Soumis Banque</option>
                            <option value="Approuvé">Approuvé</option>
                            <option value="Finalisé">Finalisé</option>
                          </select>
                        </span>
                        <span>{p.prochaineRelance ? new Date(p.prochaineRelance).toLocaleDateString('fr-FR') : '—'}</span>
                        <span className="actions-cell">
                          <button
                            type="button"
                            onClick={() => handleSaveProspect(p._id || p.id)}
                          >
                            Sauver
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingProspectId(null)}
                          >
                            Annuler
                          </button>
                        </span>
                      </>
                    ) : (
                      <>
                        <span>{p.idContact || '—'}</span>
                        <span>{[p.prenom, p.nom].filter(Boolean).join(' ') || '—'}</span>
                        <span>{p.email || '—'}</span>
                        <span>{p.telephone || '—'}</span>
                        <span>{p.scoreEligibilite ?? '—'}</span>
                        <span><span className={`badge-priority ${(p.priorite || '').toLowerCase()}`}>{p.priorite || '—'}</span></span>
                        <span>{p.statutDossier || '—'}</span>
                        <span>{p.prochaineRelance ? new Date(p.prochaineRelance).toLocaleDateString('fr-FR') : '—'}</span>
                        <span className="actions-cell">
                          <button type="button" onClick={() => openDevisModal(p)} title="Créer un devis pour ce prospect">
                            Devis
                          </button>
                          {devisAll.filter((d) => (d.prospectId?._id || d.prospectId) === (p._id || p.id)).map((d) => (
                            <button
                              key={d._id || d.id}
                              type="button"
                              onClick={() => handleDownloadDevisPDF(d)}
                              title={`Télécharger PDF ${d.numero || ''}`}
                            >
                              PDF {d.numero || ''}
                            </button>
                          ))}
                          <button type="button" onClick={() => startEditProspect(p)}>Modifier</button>
                          <button type="button" onClick={() => confirm({ title: 'Supprimer ce prospect', message: 'Êtes-vous sûr de vouloir supprimer ce prospect ?', onConfirm: () => handleDeleteProspect(p._id || p.id) })}>Supprimer</button>
                        </span>
                      </>
                    )}
                  </div>
                ))}
            </div>
              </>
            )}

            {prospectsSubview === 'catalogue' && (
              <div className="catalogue-view">
                <form className="catalogue-add-form" onSubmit={handleAddVehicule}>
                  <input
                    type="text"
                    placeholder="Marque"
                    value={newVehicule.marque}
                    onChange={(e) =>
                      setNewVehicule((v) => ({ ...v, marque: e.target.value }))
                    }
                  />
                  <input
                    type="text"
                    placeholder="Modèle"
                    value={newVehicule.modele}
                    onChange={(e) =>
                      setNewVehicule((v) => ({ ...v, modele: e.target.value }))
                    }
                  />
                  <input
                    type="number"
                    placeholder="Année"
                    value={newVehicule.annee}
                    onChange={(e) =>
                      setNewVehicule((v) => ({ ...v, annee: e.target.value }))
                    }
                  />
                  <input
                    type="number"
                    placeholder="Prix (FCFA)"
                    value={newVehicule.prix}
                    onChange={(e) =>
                      setNewVehicule((v) => ({ ...v, prix: e.target.value }))
                    }
                  />
                  <input
                    type="text"
                    placeholder="Localisation"
                    value={newVehicule.localisation}
                    onChange={(e) =>
                      setNewVehicule((v) => ({ ...v, localisation: e.target.value }))
                    }
                  />
                  <select
                    value={newVehicule.statut}
                    onChange={(e) =>
                      setNewVehicule((v) => ({ ...v, statut: e.target.value }))
                    }
                  >
                    <option value="Disponible">Disponible</option>
                    <option value="Réservé">Réservé</option>
                    <option value="Vendu">Vendu</option>
                  </select>
                  <button type="submit" disabled={savingVehicule}>
                    {savingVehicule ? 'Enregistrement...' : 'Ajouter un véhicule'}
                  </button>
                </form>
                <div className="filters-bar">
                  <input
                    type="text"
                    placeholder="Rechercher un modèle (ex: Changan, X5)..."
                    value={searchCatalogue}
                    onChange={(e) => setSearchCatalogue(e.target.value)}
                  />
                  <select
                    value={filterCatalogueStatut}
                    onChange={(e) => setFilterCatalogueStatut(e.target.value)}
                  >
                    <option value="">Tous les statuts</option>
                    <option value="Disponible">Disponible</option>
                    <option value="Vendu">Vendu</option>
                    <option value="Réservé">Réservé</option>
                  </select>
                </div>
                <p className="catalogue-intro">
                  Catalogue des véhicules disponibles — véhicules et prix uniquement.
                </p>
                <div className="catalogue-grid">
                  {catalogueDirect.map((v) => (
                    <div className="catalogue-card catalogue-card-simple" key={v._id || v.id}>
                      <p className="catalogue-card-vehicule">{[v.marque, v.modele].filter(Boolean).join(' ') || '—'}</p>
                      <p className="catalogue-card-prix">
                        {v.prix != null ? `${Number(v.prix).toLocaleString('fr-FR')} FCFA` : '—'}
                      </p>
                    </div>
                  ))}
                </div>
                {catalogueSimilar.length > 0 && searchCatalogue.trim() && (
                  <div className="catalogue-similar">
                    <h4>Modèles similaires et propositions</h4>
                    <div className="catalogue-grid">
                      {catalogueSimilar.map((v) => (
                        <div className="catalogue-card catalogue-card-simple catalogue-card-similar" key={v._id || v.id}>
                          <p className="catalogue-card-vehicule">{[v.marque, v.modele].filter(Boolean).join(' ') || '—'}</p>
                          <p className="catalogue-card-prix">
                            {v.prix != null ? `${Number(v.prix).toLocaleString('fr-FR')} FCFA` : '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {catalogueDirect.length === 0 && catalogueSimilar.length === 0 && !loading && (
                  <p className="catalogue-empty">Aucun véhicule trouvé.</p>
                )}
              </div>
            )}
          </section>
        )}

        {activeMenu === 'taches' && (
          <section className="files-section">
            <div className="files-header">
              <h2>Tâches</h2>
            </div>
            <div className="filters-bar">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTaches}
                onChange={(e) => setSearchTaches(e.target.value)}
              />
              <select
                value={filterTachesStatut}
                onChange={(e) => setFilterTachesStatut(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                <option value="A faire">A faire</option>
                <option value="En cours">En cours</option>
                <option value="Terminée">Terminée</option>
              </select>
            </div>
            <form className="inline-form" onSubmit={handleAddTache}>
              <input
                type="text"
                placeholder="Description"
                value={newTache.description}
                onChange={(e) =>
                  setNewTache((t) => ({ ...t, description: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Commercial"
                value={newTache.commercial}
                onChange={(e) =>
                  setNewTache((t) => ({ ...t, commercial: e.target.value }))
                }
              />
              <input
                type="date"
                value={newTache.echeance}
                onChange={(e) =>
                  setNewTache((t) => ({ ...t, echeance: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Statut"
                value={newTache.statut}
                onChange={(e) =>
                  setNewTache((t) => ({ ...t, statut: e.target.value }))
                }
              />
              <button type="submit" disabled={savingTache}>
                {savingTache ? 'Enregistrement...' : 'Ajouter'}
              </button>
            </form>
            <div className="files-table">
              <div className="files-row files-row-head">
                <span>Description</span>
                <span>Commercial</span>
                <span>Échéance</span>
                <span>Statut</span>
                <span>Actions</span>
              </div>
              {loading && (
                <div className="files-row">
                  <span>Chargement...</span>
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              )}
              {error && !loading && (
                <div className="files-row">
                  <span>{error}</span>
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              )}
              {!loading &&
                !error &&
                filteredTaches.map((t) => (
                  <div className="files-row" key={t._id || t.id}>
                    {editingTacheId === (t._id || t.id) ? (
                      <>
                        <span>
                          <input
                            className="cell-input"
                            value={editingTache.description}
                            onChange={(e) =>
                              setEditingTache((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                          />
                        </span>
                        <span>
                          <input
                            className="cell-input"
                            value={editingTache.commercial}
                            onChange={(e) =>
                              setEditingTache((prev) => ({
                                ...prev,
                                commercial: e.target.value,
                              }))
                            }
                          />
                        </span>
                        <span>
                          <input
                            className="cell-input"
                            type="date"
                            value={editingTache.echeance}
                            onChange={(e) =>
                              setEditingTache((prev) => ({
                                ...prev,
                                echeance: e.target.value,
                              }))
                            }
                          />
                        </span>
                        <span>
                          <input
                            className="cell-input"
                            value={editingTache.statut}
                            onChange={(e) =>
                              setEditingTache((prev) => ({
                                ...prev,
                                statut: e.target.value,
                              }))
                            }
                          />
                        </span>
                        <span className="actions-cell">
                          <button
                            type="button"
                            onClick={() => handleSaveTache(t._id || t.id)}
                          >
                            Sauver
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTacheId(null)}
                          >
                            Annuler
                          </button>
                        </span>
                      </>
                    ) : (
                      <>
                        <span>{t.description}</span>
                        <span>{t.commercial}</span>
                        <span>
                          {t.echeance
                            ? new Date(t.echeance).toLocaleDateString('fr-FR')
                            : ''}
                        </span>
                        <span>{t.statut}</span>
                        <span className="actions-cell">
                          <button
                            type="button"
                            onClick={() => startEditTache(t)}
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => confirm({ title: 'Supprimer cette tâche', message: 'Êtes-vous sûr de vouloir supprimer cette tâche ?', onConfirm: () => handleDeleteTache(t._id || t.id) })}
                          >
                            Supprimer
                          </button>
                        </span>
                      </>
                    )}
                  </div>
                ))}
            </div>
          </section>
        )}

        {activeMenu === 'vehicules' && (
          <section className="files-section">
            <div className="files-header">
              <h2>Stock véhicules</h2>
            </div>
            <div className="filters-bar">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchVehicules}
                onChange={(e) => setSearchVehicules(e.target.value)}
              />
              <select
                value={filterVehiculesStatut}
                onChange={(e) => setFilterVehiculesStatut(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                <option value="Disponible">Disponible</option>
                <option value="Réservé">Réservé</option>
                <option value="Vendu">Vendu</option>
              </select>
            </div>
            <form className="inline-form" onSubmit={handleAddVehicule}>
              <input
                type="text"
                placeholder="Marque"
                value={newVehicule.marque}
                onChange={(e) =>
                  setNewVehicule((v) => ({ ...v, marque: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Modèle"
                value={newVehicule.modele}
                onChange={(e) =>
                  setNewVehicule((v) => ({ ...v, modele: e.target.value }))
                }
              />
              <input
                type="number"
                placeholder="Année"
                value={newVehicule.annee}
                onChange={(e) =>
                  setNewVehicule((v) => ({ ...v, annee: e.target.value }))
                }
              />
              <input
                type="number"
                placeholder="Prix (FCFA)"
                value={newVehicule.prix}
                onChange={(e) =>
                  setNewVehicule((v) => ({ ...v, prix: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Localisation"
                value={newVehicule.localisation}
                onChange={(e) =>
                  setNewVehicule((v) => ({
                    ...v,
                    localisation: e.target.value,
                  }))
                }
              />
              <button type="submit" disabled={savingVehicule}>
                {savingVehicule ? 'Enregistrement...' : 'Ajouter'}
              </button>
            </form>
            <div className="files-table">
              <div className="files-row files-row-head">
                <span>Véhicule</span>
                <span>Année</span>
                <span>Prix</span>
                <span>Statut</span>
                <span>Actions</span>
              </div>
              {loading && (
                <div className="files-row">
                  <span>Chargement...</span>
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              )}
              {error && !loading && (
                <div className="files-row">
                  <span>{error}</span>
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              )}
              {!loading &&
                !error &&
                filteredVehicules.map((v) => (
                  <div className="files-row" key={v._id || v.id}>
                    {editingVehiculeId === (v._id || v.id) ? (
                      <>
                        <span>
                          <input
                            className="cell-input"
                            placeholder="Marque"
                            value={editingVehicule.marque}
                            onChange={(e) =>
                              setEditingVehicule((prev) => ({
                                ...prev,
                                marque: e.target.value,
                              }))
                            }
                          />
                          <input
                            className="cell-input"
                            placeholder="Modèle"
                            value={editingVehicule.modele}
                            onChange={(e) =>
                              setEditingVehicule((prev) => ({
                                ...prev,
                                modele: e.target.value,
                              }))
                            }
                          />
                        </span>
                        <span>
                          <input
                            className="cell-input"
                            type="number"
                            value={editingVehicule.annee}
                            onChange={(e) =>
                              setEditingVehicule((prev) => ({
                                ...prev,
                                annee: e.target.value,
                              }))
                            }
                          />
                        </span>
                        <span>
                          <input
                            className="cell-input"
                            type="number"
                            value={editingVehicule.prix}
                            onChange={(e) =>
                              setEditingVehicule((prev) => ({
                                ...prev,
                                prix: e.target.value,
                              }))
                            }
                          />
                        </span>
                        <span>
                          <input
                            className="cell-input"
                            value={editingVehicule.statut}
                            onChange={(e) =>
                              setEditingVehicule((prev) => ({
                                ...prev,
                                statut: e.target.value,
                              }))
                            }
                          />
                        </span>
                        <span className="actions-cell">
                          <button
                            type="button"
                            onClick={() => handleSaveVehicule(v._id || v.id)}
                          >
                            Sauver
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingVehiculeId(null)}
                          >
                            Annuler
                          </button>
                        </span>
                      </>
                    ) : (
                      <>
                        <span>
                          {v.marque} {v.modele}
                        </span>
                        <span>{v.annee}</span>
                        <span>{v.prix.toLocaleString('fr-FR')} FCFA</span>
                        <span>{v.statut}</span>
                        <span className="actions-cell">
                          <button
                            type="button"
                            onClick={() => startEditVehicule(v)}
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => confirm({ title: 'Supprimer ce véhicule', message: 'Êtes-vous sûr de vouloir supprimer ce véhicule ?', onConfirm: () => handleDeleteVehicule(v._id || v.id) })}
                          >
                            Supprimer
                          </button>
                        </span>
                      </>
                    )}
                  </div>
                ))}
            </div>
          </section>
        )}

        {activeMenu === 'interactions' && (
          <section className="files-section">
            <div className="files-header">
              <h2>Interactions</h2>
            </div>
            <div className="filters-bar">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchInteractions}
                onChange={(e) => setSearchInteractions(e.target.value)}
              />
              <select
                value={filterInteractionsType}
                onChange={(e) => setFilterInteractionsType(e.target.value)}
              >
                <option value="">Tous les types</option>
                <option value="Appel">Appel</option>
                <option value="Email">Email</option>
                <option value="RDV">RDV</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <form className="inline-form" onSubmit={handleAddInteraction}>
              <input
                type="date"
                value={newInteraction.date}
                onChange={(e) =>
                  setNewInteraction((i) => ({ ...i, date: e.target.value }))
                }
              />
              <select
                value={newInteraction.type}
                onChange={(e) =>
                  setNewInteraction((i) => ({ ...i, type: e.target.value }))
                }
              >
                <option value="Appel">Appel</option>
                <option value="Email">Email</option>
                <option value="RDV">RDV</option>
                <option value="Autre">Autre</option>
              </select>
              <input
                type="text"
                placeholder="Sujet"
                value={newInteraction.sujet}
                onChange={(e) =>
                  setNewInteraction((i) => ({ ...i, sujet: e.target.value }))
                }
              />
              <textarea
                placeholder="Contenu"
                value={newInteraction.contenu}
                onChange={(e) =>
                  setNewInteraction((i) => ({ ...i, contenu: e.target.value }))
                }
                rows="1"
              />
              <button type="submit" disabled={savingInteraction}>
                {savingInteraction ? 'Enregistrement...' : 'Ajouter'}
              </button>
            </form>
            <div className="files-table">
              <div className="files-row files-row-head">
                <span>Date</span>
                <span>Type</span>
                <span>Sujet</span>
                <span>Contenu</span>
                <span>Actions</span>
              </div>
              {loading && (
                <div className="files-row">
                  <span>Chargement...</span>
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              )}
              {!loading &&
                filteredInteractions.map((i) => (
                  <div className="files-row" key={i._id || i.id}>
                    {editingInteractionId === (i._id || i.id) ? (
                      <>
                        <span>
                          <input
                            className="cell-input"
                            type="date"
                            value={editingInteraction.date}
                            onChange={(e) =>
                              setEditingInteraction((prev) => ({
                                ...prev,
                                date: e.target.value,
                              }))
                            }
                          />
                        </span>
                        <span>
                          <select
                            className="cell-input"
                            value={editingInteraction.type}
                            onChange={(e) =>
                              setEditingInteraction((prev) => ({
                                ...prev,
                                type: e.target.value,
                              }))
                            }
                          >
                            <option value="Appel">Appel</option>
                            <option value="Email">Email</option>
                            <option value="RDV">RDV</option>
                            <option value="Autre">Autre</option>
                          </select>
                        </span>
                        <span>
                          <input
                            className="cell-input"
                            value={editingInteraction.sujet}
                            onChange={(e) =>
                              setEditingInteraction((prev) => ({
                                ...prev,
                                sujet: e.target.value,
                              }))
                            }
                          />
                        </span>
                        <span>
                          <textarea
                            className="cell-input"
                            value={editingInteraction.contenu}
                            onChange={(e) =>
                              setEditingInteraction((prev) => ({
                                ...prev,
                                contenu: e.target.value,
                              }))
                            }
                            rows="2"
                          />
                        </span>
                        <span className="actions-cell">
                          <button
                            type="button"
                            onClick={() => handleSaveInteraction(i._id || i.id)}
                          >
                            Sauver
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingInteractionId(null)}
                          >
                            Annuler
                          </button>
                        </span>
                      </>
                    ) : (
                      <>
                        <span>
                          {i.date
                            ? new Date(i.date).toLocaleDateString('fr-FR')
                            : '-'}
                        </span>
                        <span>{i.type}</span>
                        <span>{i.sujet}</span>
                        <span>{i.contenu || '-'}</span>
                        <span className="actions-cell">
                          <button
                            type="button"
                            onClick={() => startEditInteraction(i)}
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => confirm({ title: 'Supprimer cette interaction', message: 'Êtes-vous sûr de vouloir supprimer cette interaction ?', onConfirm: () => handleDeleteInteraction(i._id || i.id) })}
                          >
                            Supprimer
                          </button>
                        </span>
                      </>
                    )}
                  </div>
                ))}
            </div>
          </section>
        )}

        {activeMenu === 'devis' && (
          <section className="files-section">
            <div className="files-header">
              <h2>Devis</h2>
              <div className="export-buttons">
                <button type="button" className="btn-upload" onClick={openDevisModal}>
                  Nouveau devis complet
                </button>
                <button type="button" onClick={handleExportDevisPDF}>
                  Export PDF
                </button>
                <button type="button" onClick={handleExportDevisExcel}>
                  Export Excel
                </button>
              </div>
            </div>
            <div className="filters-bar">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchDevis}
                onChange={(e) => setSearchDevis(e.target.value)}
              />
              <select
                value={filterDevisStatut}
                onChange={(e) => setFilterDevisStatut(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                <option value="En cours">En cours</option>
                <option value="Accepté">Accepté</option>
                <option value="Refusé">Refusé</option>
              </select>
            </div>
            <form className="inline-form" onSubmit={handleAddDevis}>
              <input
                type="text"
                placeholder="N° devis"
                value={newDevis.numero}
                onChange={(e) =>
                  setNewDevis((d) => ({ ...d, numero: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Client"
                value={newDevis.client}
                onChange={(e) =>
                  setNewDevis((d) => ({ ...d, client: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Véhicule"
                value={newDevis.vehicule}
                onChange={(e) =>
                  setNewDevis((d) => ({ ...d, vehicule: e.target.value }))
                }
              />
              <input
                type="number"
                placeholder="Montant (FCFA)"
                value={newDevis.montant}
                onChange={(e) =>
                  setNewDevis((d) => ({ ...d, montant: e.target.value }))
                }
              />
              <select
                value={newDevis.statut}
                onChange={(e) =>
                  setNewDevis((d) => ({ ...d, statut: e.target.value }))
                }
              >
                <option value="En cours">En cours</option>
                <option value="Accepté">Accepté</option>
                <option value="Refusé">Refusé</option>
              </select>
              <button type="submit" disabled={savingDevis}>
                {savingDevis ? 'Enregistrement...' : 'Ajouter'}
              </button>
            </form>
            <div className="files-table">
              <div className="files-row files-row-head">
                <span>N° Devis</span>
                <span>Client</span>
                <span>Véhicule</span>
                <span>Montant</span>
                <span>Statut</span>
                <span>Actions</span>
              </div>
              {loading && (
                <div className="files-row">
                  <span>Chargement...</span>
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              )}
              {!loading &&
                filteredDevis.map((d) => (
                  <div className="files-row" key={d._id || d.id}>
                    <span>{d.numero}</span>
                    <span>{d.clientEntreprise || d.client}</span>
                    <span>{d.objet || d.vehicule}</span>
                    <span>
                      {d.montant != null ? `${d.montant.toLocaleString('fr-FR')} FCFA` : '-'}
                    </span>
                    <span>{d.statut}</span>
                    <span className="actions-cell">
                      <button
                        type="button"
                        onClick={() => handleDownloadDevisPDF(d)}
                      >
                        Générer PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditDevisComplet(d)}
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => confirm({ title: 'Supprimer ce devis', message: 'Êtes-vous sûr de vouloir supprimer ce devis ?', onConfirm: () => handleDeleteDevis(d._id || d.id) })}
                      >
                        Supprimer
                      </button>
                    </span>
                  </div>
                ))}
            </div>
          </section>
        )}

        {activeMenu === 'factures' && (
          <section className="files-section">
            <div className="files-header">
              <h2>Factures</h2>
              <div className="export-buttons">
                <button type="button" onClick={handleExportFacturePDF}>
                  Export PDF
                </button>
                <button type="button" onClick={handleExportFactureExcel}>
                  Export Excel
                </button>
              </div>
            </div>
            <div className="filters-bar">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchFactures}
                onChange={(e) => setSearchFactures(e.target.value)}
              />
              <select
                value={filterFacturesStatut}
                onChange={(e) => setFilterFacturesStatut(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                <option value="Émise">Émise</option>
                <option value="Payée">Payée</option>
                <option value="En Retard">En Retard</option>
              </select>
            </div>
            <form className="inline-form" onSubmit={handleAddFacture}>
              <input
                type="text"
                placeholder="N° facture"
                value={newFacture.numero}
                onChange={(e) =>
                  setNewFacture((f) => ({ ...f, numero: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Client"
                value={newFacture.client}
                onChange={(e) =>
                  setNewFacture((f) => ({ ...f, client: e.target.value }))
                }
              />
              <input
                type="number"
                placeholder="Montant (FCFA)"
                value={newFacture.montant}
                onChange={(e) =>
                  setNewFacture((f) => ({ ...f, montant: e.target.value }))
                }
              />
              <input
                type="date"
                placeholder="Date émission"
                value={newFacture.dateEmission}
                onChange={(e) =>
                  setNewFacture((f) => ({ ...f, dateEmission: e.target.value }))
                }
              />
              <input
                type="date"
                placeholder="Date échéance"
                value={newFacture.dateEcheance}
                onChange={(e) =>
                  setNewFacture((f) => ({ ...f, dateEcheance: e.target.value }))
                }
              />
              <select
                value={newFacture.statut}
                onChange={(e) =>
                  setNewFacture((f) => ({ ...f, statut: e.target.value }))
                }
              >
                <option value="Émise">Émise</option>
                <option value="Payée">Payée</option>
                <option value="En Retard">En Retard</option>
              </select>
              <button type="submit" disabled={savingFacture}>
                {savingFacture ? 'Enregistrement...' : 'Ajouter'}
              </button>
            </form>
            <div className="files-table">
              <div className="files-row files-row-head">
                <span>N° Facture</span>
                <span>Client</span>
                <span>Montant</span>
                <span>Date émission</span>
                <span>Date échéance</span>
                <span>Statut</span>
                <span>Actions</span>
              </div>
              {loading && (
                <div className="files-row">
                  <span>Chargement...</span>
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              )}
              {!loading &&
                filteredFactures.map((f) => (
                  <div className="files-row" key={f._id || f.id}>
                    {editingFactureId === (f._id || f.id) ? (
                      <>
                        <span>
                          <input
                            className="cell-input"
                            value={editingFacture.numero}
                            onChange={(e) =>
                              setEditingFacture((prev) => ({
                                ...prev,
                                numero: e.target.value,
                              }))
                            }
                          />
                        </span>
                        <span>
                          <input
                            className="cell-input"
                            value={editingFacture.client}
                            onChange={(e) =>
                              setEditingFacture((prev) => ({
                                ...prev,
                                client: e.target.value,
                              }))
                            }
                          />
                        </span>
                        <span>
                          <input
                            className="cell-input"
                            type="number"
                            value={editingFacture.montant}
                            onChange={(e) =>
                              setEditingFacture((prev) => ({
                                ...prev,
                                montant: e.target.value,
                              }))
                            }
                          />
                        </span>
                        <span>
                          <input
                            className="cell-input"
                            type="date"
                            value={editingFacture.dateEmission}
                            onChange={(e) =>
                              setEditingFacture((prev) => ({
                                ...prev,
                                dateEmission: e.target.value,
                              }))
                            }
                          />
                        </span>
                        <span>
                          <input
                            className="cell-input"
                            type="date"
                            value={editingFacture.dateEcheance}
                            onChange={(e) =>
                              setEditingFacture((prev) => ({
                                ...prev,
                                dateEcheance: e.target.value,
                              }))
                            }
                          />
                        </span>
                        <span>
                          <select
                            className="cell-input"
                            value={editingFacture.statut}
                            onChange={(e) =>
                              setEditingFacture((prev) => ({
                                ...prev,
                                statut: e.target.value,
                              }))
                            }
                          >
                            <option value="Émise">Émise</option>
                            <option value="Payée">Payée</option>
                            <option value="En Retard">En Retard</option>
                          </select>
                        </span>
                        <span className="actions-cell">
                          <button
                            type="button"
                            onClick={() => handleSaveFacture(f._id || f.id)}
                          >
                            Sauver
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingFactureId(null)}
                          >
                            Annuler
                          </button>
                        </span>
                      </>
                    ) : (
                      <>
                        <span>{f.numero}</span>
                        <span>{f.client}</span>
                        <span>
                          {f.montant ? `${f.montant.toLocaleString('fr-FR')} FCFA` : '-'}
                        </span>
                        <span>
                          {f.dateEmission
                            ? new Date(f.dateEmission).toLocaleDateString('fr-FR')
                            : '-'}
                        </span>
                        <span>
                          {f.dateEcheance
                            ? new Date(f.dateEcheance).toLocaleDateString('fr-FR')
                            : '-'}
                        </span>
                        <span>{f.statut}</span>
                        <span className="actions-cell">
                          <button
                            type="button"
                            onClick={() => startEditFacture(f)}
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => confirm({ title: 'Supprimer cette facture', message: 'Êtes-vous sûr de vouloir supprimer cette facture ?', onConfirm: () => handleDeleteFacture(f._id || f.id) })}
                          >
                            Supprimer
                          </button>
                        </span>
                      </>
                    )}
                  </div>
                ))}
            </div>
          </section>
        )}

        {activeMenu === 'banques' && (
          <section className="files-section">
            <div className="files-header">
              <h2>Banques partenaires</h2>
            </div>
            <p className="section-desc">Référentiel des conditions de financement (BGFI, UGB, BICIG, Orabank...). Utilisé pour le matching bancaire.</p>
            <form className="inline-form" onSubmit={handleAddBanque}>
              <input type="text" placeholder="Nom (ex: BGFI)" value={newBanque.nom} onChange={(e) => setNewBanque((b) => ({ ...b, nom: e.target.value }))} />
              <input type="number" placeholder="Taux min %" value={newBanque.tauxMin} onChange={(e) => setNewBanque((b) => ({ ...b, tauxMin: e.target.value }))} />
              <input type="number" placeholder="Taux max %" value={newBanque.tauxMax} onChange={(e) => setNewBanque((b) => ({ ...b, tauxMax: e.target.value }))} />
              <input type="number" placeholder="Apport min %" value={newBanque.apportMinPourcent} onChange={(e) => setNewBanque((b) => ({ ...b, apportMinPourcent: e.target.value }))} />
              <input type="number" placeholder="Durée max (mois)" value={newBanque.dureeMaxMois} onChange={(e) => setNewBanque((b) => ({ ...b, dureeMaxMois: e.target.value }))} />
              <button type="submit" disabled={savingBanque}>{savingBanque ? 'Enregistrement...' : 'Ajouter'}</button>
            </form>
            <div className="files-table">
              <div className="files-row files-row-head">
                <span>Nom</span>
                <span>Taux min</span>
                <span>Taux max</span>
                <span>Apport min %</span>
                <span>Durée max</span>
                <span>Actions</span>
              </div>
              {banques.map((b) => (
                <div className="files-row" key={b._id || b.id}>
                  {editingBanqueId === (b._id || b.id) ? (
                    <>
                      <span><input className="cell-input" value={editingBanque.nom} onChange={(e) => setEditingBanque((prev) => ({ ...prev, nom: e.target.value }))} /></span>
                      <span><input className="cell-input" type="number" value={editingBanque.tauxMin} onChange={(e) => setEditingBanque((prev) => ({ ...prev, tauxMin: e.target.value }))} /></span>
                      <span><input className="cell-input" type="number" value={editingBanque.tauxMax} onChange={(e) => setEditingBanque((prev) => ({ ...prev, tauxMax: e.target.value }))} /></span>
                      <span><input className="cell-input" type="number" value={editingBanque.apportMinPourcent} onChange={(e) => setEditingBanque((prev) => ({ ...prev, apportMinPourcent: e.target.value }))} /></span>
                      <span><input className="cell-input" type="number" value={editingBanque.dureeMaxMois} onChange={(e) => setEditingBanque((prev) => ({ ...prev, dureeMaxMois: e.target.value }))} /></span>
                      <span className="actions-cell">
                        <button type="button" onClick={() => handleSaveBanque(b._id || b.id)}>Sauver</button>
                        <button type="button" onClick={() => setEditingBanqueId(null)}>Annuler</button>
                      </span>
                    </>
                  ) : (
                    <>
                      <span>{b.nom}</span>
                      <span>{b.tauxMin ?? '—'}</span>
                      <span>{b.tauxMax ?? '—'}</span>
                      <span>{b.apportMinPourcent ?? '—'}%</span>
                      <span>{b.dureeMaxMois ?? '—'} mois</span>
                      <span className="actions-cell">
                        <button type="button" onClick={() => startEditBanque(b)}>Modifier</button>
                        <button type="button" onClick={() => confirm({ title: 'Supprimer cette banque', message: 'Êtes-vous sûr de vouloir supprimer cette banque ?', onConfirm: () => handleDeleteBanque(b._id || b.id) })}>Supprimer</button>
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {activeMenu === 'relances-emails' && (
          <section className="files-section">
            <div className="files-header">
              <h2>Relances Emails</h2>
            </div>
            <form className="inline-form" onSubmit={handleAddRelanceEmail}>
              <input
                type="text"
                placeholder="Nom du modèle"
                value={newRelanceEmail.nom}
                onChange={(e) =>
                  setNewRelanceEmail((r) => ({ ...r, nom: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Sujet"
                value={newRelanceEmail.sujet}
                onChange={(e) =>
                  setNewRelanceEmail((r) => ({ ...r, sujet: e.target.value }))
                }
              />
              <textarea
                placeholder="Corps de l'email"
                value={newRelanceEmail.corps}
                onChange={(e) =>
                  setNewRelanceEmail((r) => ({ ...r, corps: e.target.value }))
                }
                rows="2"
              />
              <input
                type="number"
                placeholder="Séquence"
                value={newRelanceEmail.sequence}
                onChange={(e) =>
                  setNewRelanceEmail((r) => ({
                    ...r,
                    sequence: Number(e.target.value) || 0,
                  }))
                }
              />
              <button type="submit" disabled={savingRelanceEmail}>
                {savingRelanceEmail ? 'Enregistrement...' : 'Ajouter'}
              </button>
            </form>
            <div className="files-table">
              <div className="files-row files-row-head">
                <span>Nom</span>
                <span>Sujet</span>
                <span>Corps</span>
                <span>Séquence</span>
                <span>Actions</span>
              </div>
              {loading && (
                <div className="files-row">
                  <span>Chargement...</span>
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              )}
              {!loading &&
                relancesEmails.map((r) => (
                  <div className="files-row" key={r._id || r.id}>
                    {editingRelanceEmailId === (r._id || r.id) ? (
                      <>
                        <span>
                          <input
                            className="cell-input"
                            value={editingRelanceEmail.nom}
                            onChange={(e) =>
                              setEditingRelanceEmail((prev) => ({
                                ...prev,
                                nom: e.target.value,
                              }))
                            }
                          />
                        </span>
                        <span>
                          <input
                            className="cell-input"
                            value={editingRelanceEmail.sujet}
                            onChange={(e) =>
                              setEditingRelanceEmail((prev) => ({
                                ...prev,
                                sujet: e.target.value,
                              }))
                            }
                          />
                        </span>
                        <span>
                          <textarea
                            className="cell-input"
                            value={editingRelanceEmail.corps}
                            onChange={(e) =>
                              setEditingRelanceEmail((prev) => ({
                                ...prev,
                                corps: e.target.value,
                              }))
                            }
                            rows="2"
                          />
                        </span>
                        <span>
                          <input
                            className="cell-input"
                            type="number"
                            value={editingRelanceEmail.sequence}
                            onChange={(e) =>
                              setEditingRelanceEmail((prev) => ({
                                ...prev,
                                sequence: Number(e.target.value) || 0,
                              }))
                            }
                          />
                        </span>
                        <span className="actions-cell">
                          <button
                            type="button"
                            onClick={() => handleSaveRelanceEmail(r._id || r.id)}
                          >
                            Sauver
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingRelanceEmailId(null)}
                          >
                            Annuler
                          </button>
                        </span>
                      </>
                    ) : (
                      <>
                        <span>{r.nom}</span>
                        <span>{r.sujet}</span>
                        <span>{r.corps || '-'}</span>
                        <span>{r.sequence}</span>
                        <span className="actions-cell">
                          <button
                            type="button"
                            onClick={() => startEditRelanceEmail(r)}
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => confirm({ title: 'Supprimer ce modèle', message: 'Êtes-vous sûr de vouloir supprimer ce modèle de relance ?', onConfirm: () => handleDeleteRelanceEmail(r._id || r.id) })}
                          >
                            Supprimer
                          </button>
                        </span>
                      </>
                    )}
                  </div>
                ))}
            </div>
          </section>
        )}

        {activeMenu === 'parametres' && (
          <section className="files-section parametres-section">
            <div className="parametres-profil">
              <h2>Mon profil</h2>
              <div className="profil-photo-block">
                <div className="profil-photo-wrapper">
                  {currentUser?.profileImage ? (
                    <img
                      src={currentUser.profileImage}
                      alt="Photo de profil"
                      className="profil-photo"
                    />
                  ) : (
                    <div className="profil-photo-placeholder">
                      {(currentUser?.prenom || currentUser?.nom || currentUser?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="profil-photo-actions">
                  <label className="btn-upload-photo">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleUpdateProfileImage(f)
                        e.target.value = ''
                      }}
                    />
                    Choisir une photo
                  </label>
                </div>
              </div>

              <div className="profil-infos-block">
                <h3>Informations de l&apos;utilisateur</h3>
                <div className="profil-info-row">
                  <span className="profil-info-label">Email :</span>
                  <span className="profil-info-value">{currentUser?.email}</span>
                </div>
                <div className="profil-info-row">
                  <span className="profil-info-label">Rôle :</span>
                  <span className="profil-info-value">{currentUser?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</span>
                </div>
                {(currentUser?.nom || currentUser?.prenom) && (
                  <div className="profil-info-row">
                    <span className="profil-info-label">Nom complet :</span>
                    <span className="profil-info-value">{[currentUser?.prenom, currentUser?.nom].filter(Boolean).join(' ')}</span>
                  </div>
                )}
                {currentUser?.departement && (
                  <div className="profil-info-row">
                    <span className="profil-info-label">Département :</span>
                    <span className="profil-info-value">
                      {currentUser.departement === 'commercial' ? 'Commercial' : currentUser.departement === 'referant digital' ? 'Référent digital' : currentUser.departement === 'informatique' ? 'Informatique' : currentUser.departement}
                    </span>
                  </div>
                )}
              </div>

              <div className="profil-edit-block">
                <h3>Modifier mon profil</h3>
                <div className="profil-edit-form">
                  <div className="profil-edit-row">
                    <label>Prénom</label>
                    <input
                      type="text"
                      value={profilPrenom}
                      onChange={(e) => setProfilPrenom(e.target.value)}
                      placeholder="Prénom"
                      className="cell-input"
                    />
                  </div>
                  <div className="profil-edit-row">
                    <label>Nom</label>
                    <input
                      type="text"
                      value={profilNom}
                      onChange={(e) => setProfilNom(e.target.value)}
                      placeholder="Nom"
                      className="cell-input"
                    />
                  </div>
                  <div className="profil-edit-row">
                    <label>Département</label>
                    <select
                      value={profilDepartement}
                      onChange={(e) => setProfilDepartement(e.target.value)}
                      className="cell-input"
                    >
                      <option value="">— Non défini —</option>
                      <option value="commercial">Commercial</option>
                      <option value="referant digital">Référent digital</option>
                      <option value="informatique">Informatique</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleUpdateProfile}
                    disabled={savingProfil}
                  >
                    {savingProfil ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="btn-deconnexion"
                onClick={handleLogout}
              >
                Se déconnecter
              </button>
            </div>

            {currentUser?.role === 'admin' && (
              <div className="parametres-users">
                <h2>Gestion des utilisateurs</h2>
                <div className="files-table">
                  <div className="files-row files-row-head">
                    <span>Email</span>
                    <span>Rôle</span>
                    <span>Actions</span>
                  </div>
                  {loading && (
                    <div className="files-row">
                      <span>Chargement...</span>
                      <span />
                      <span />
                    </div>
                  )}
                  {!loading &&
                    users.map((u) => (
                      <div className="files-row" key={u._id || u.id}>
                        <span>{u.email}</span>
                        <span>
                          <select
                            className="cell-input"
                            value={u.role}
                            onChange={(e) =>
                              handleUpdateUserRole(u._id || u.id, e.target.value)
                            }
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </span>
                        <span className="actions-cell">
                          <button
                            type="button"
                            onClick={() => confirm({ title: 'Supprimer cet utilisateur', message: 'Êtes-vous sûr de vouloir supprimer cet utilisateur ?', onConfirm: () => handleDeleteUser(u._id || u.id) })}
                          >
                            Supprimer
                          </button>
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="parametres-about">
              <h2>À propos</h2>
              <div className="about-card">
                <p className="about-text">
                  Ce logiciel est une propriété du <strong>BON WAZ</strong>.
                </p>
                <p className="about-text">
                  Développé par <strong>NGUEMA ELLA Axel RAUMANCE</strong>
                </p>
                <p className="about-text about-role">Développeur full-stack</p>
              </div>
            </div>
          </section>
        )}
      </main>

      {devisModalOpen && (
        <div className="modal-overlay" onClick={() => setDevisModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{devisEditId ? 'Modifier le devis' : 'Nouveau devis complet'}</h3>
              <button type="button" className="modal-close" onClick={() => setDevisModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSaveDevisComplet}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label>Prospect / Client</label>
                  <select
                    value={devisFormComplet.prospectId || ''}
                    onChange={(e) => {
                      const pid = e.target.value
                      const pr = prospects.find((p) => (p._id || p.id) === pid)
                      setDevisFormComplet((f) => ({
                        ...f,
                        prospectId: pid,
                        clientEntreprise: pr ? [pr.prenom, pr.nom].filter(Boolean).join(' ') || pr.email || '' : f.clientEntreprise,
                        clientResponsable: pr ? [pr.prenom, pr.nom].filter(Boolean).join(' ') : f.clientResponsable,
                        clientTelephone: pr?.telephone || f.clientTelephone,
                        clientEmail: pr?.email || f.clientEmail,
                      }))
                    }}
                  >
                    <option value="">— Aucun prospect —</option>
                    {prospects.map((p) => (
                      <option key={p._id || p.id} value={p._id || p.id}>
                        {[p.prenom, p.nom].filter(Boolean).join(' ') || p.email || p.idContact || 'Prospect'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-form-group">
                  <label>N° Devis</label>
                  <input
                    value={devisFormComplet.numero}
                    onChange={(e) => setDevisFormComplet((f) => ({ ...f, numero: e.target.value }))}
                    placeholder="Ex: DEV-2024-001"
                  />
                </div>
                <h4 style={{ margin: '16px 0 8px', fontSize: 14, color: '#475569' }}>Informations client</h4>
                <div className="modal-form-group">
                  <label>Entreprise *</label>
                  <input
                    value={devisFormComplet.clientEntreprise}
                    onChange={(e) => setDevisFormComplet((f) => ({ ...f, clientEntreprise: e.target.value }))}
                    placeholder="Nom de l'entreprise"
                    required
                  />
                </div>
                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label>Responsable</label>
                    <input
                      value={devisFormComplet.clientResponsable}
                      onChange={(e) => setDevisFormComplet((f) => ({ ...f, clientResponsable: e.target.value }))}
                      placeholder="Nom du responsable"
                    />
                  </div>
                  <div className="modal-form-group">
                    <label>Téléphone</label>
                    <input
                      value={devisFormComplet.clientTelephone}
                      onChange={(e) => setDevisFormComplet((f) => ({ ...f, clientTelephone: e.target.value }))}
                      placeholder="+241 XX XX XX XX"
                    />
                  </div>
                </div>
                <div className="modal-form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={devisFormComplet.clientEmail}
                    onChange={(e) => setDevisFormComplet((f) => ({ ...f, clientEmail: e.target.value }))}
                    placeholder="email@exemple.com"
                  />
                </div>
                <div className="modal-form-group">
                  <label>Objet (véhicule / leasing)</label>
                  <input
                    value={devisFormComplet.objet}
                    onChange={(e) => setDevisFormComplet((f) => ({ ...f, objet: e.target.value }))}
                    placeholder="Ex: Leasing intégral ALL-INCLUSIVE – CHANGAN X5 PLUS"
                  />
                </div>
                <h4 style={{ margin: '16px 0 8px', fontSize: 14, color: '#475569' }}>Montants (FCFA)</h4>
                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label>1er loyer / Apport</label>
                    <input
                      type="number"
                      value={devisFormComplet.premierLoyer}
                      onChange={(e) => setDevisFormComplet((f) => ({ ...f, premierLoyer: e.target.value }))}
                      placeholder="Ex: 5000000"
                    />
                  </div>
                  <div className="modal-form-group">
                    <label>Mensualité fixe</label>
                    <input
                      type="number"
                      value={devisFormComplet.mensualiteFixe}
                      onChange={(e) => setDevisFormComplet((f) => ({ ...f, mensualiteFixe: e.target.value }))}
                      placeholder="Ex: 525000"
                    />
                  </div>
                </div>
                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label>Durée (mois)</label>
                    <input
                      type="number"
                      value={devisFormComplet.dureeMois}
                      onChange={(e) => setDevisFormComplet((f) => ({ ...f, dureeMois: Number(e.target.value) || 48 }))}
                      placeholder="48"
                    />
                  </div>
                  <div className="modal-form-group">
                    <label>Option d'achat</label>
                    <input
                      type="number"
                      value={devisFormComplet.optionAchat}
                      onChange={(e) => setDevisFormComplet((f) => ({ ...f, optionAchat: e.target.value }))}
                      placeholder="Ex: 500000"
                    />
                  </div>
                </div>
                <h4 style={{ margin: '16px 0 8px', fontSize: 14, color: '#475569' }}>TVA</h4>
                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label>Taux TVA (%)</label>
                    <input
                      type="number"
                      value={devisFormComplet.tvaTaux}
                      onChange={(e) => setDevisFormComplet((f) => ({ ...f, tvaTaux: e.target.value }))}
                      placeholder="18"
                    />
                  </div>
                  <div className="modal-form-group">
                    <label>Montant HT (FCFA)</label>
                    <input
                      type="number"
                      value={devisFormComplet.montantHT}
                      onChange={(e) => setDevisFormComplet((f) => ({ ...f, montantHT: e.target.value }))}
                      placeholder="Montant hors taxes"
                    />
                  </div>
                </div>
                <div className="modal-form-group">
                  <label>Éléments inclus (un par ligne)</label>
                  <textarea
                    rows={5}
                    value={devisFormComplet.inclus}
                    onChange={(e) => setDevisFormComplet((f) => ({ ...f, inclus: e.target.value }))}
                    placeholder="- Véhicule neuf..."
                  />
                </div>
                <div className="modal-form-group">
                  <label>Conditions contractuelles (un par ligne)</label>
                  <textarea
                    rows={4}
                    value={devisFormComplet.conditions}
                    onChange={(e) => setDevisFormComplet((f) => ({ ...f, conditions: e.target.value }))}
                    placeholder="- Durée : selon contrat..."
                  />
                </div>
                <div className="modal-form-group">
                  <label>Statut</label>
                  <select
                    value={devisFormComplet.statut}
                    onChange={(e) => setDevisFormComplet((f) => ({ ...f, statut: e.target.value }))}
                  >
                    <option value="En cours">En cours</option>
                    <option value="Accepté">Accepté</option>
                    <option value="Refusé">Refusé</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setDevisModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={savingDevis}>
                  {savingDevis ? 'Enregistrement...' : (devisEditId ? 'Enregistrer' : 'Créer le devis')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
