import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { validateSessionToken } from '../lib/jwtHelper'
import {
  Plus,
  Trash,
  PlusCircle,
  Save,
  MapPin,
  Package,
  ArrowLeft,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
  Pencil,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  LogOut,
} from 'lucide-react'

/**
 * Deserializes the plain-text Detalles field back into structured form states.
 */
function deserializeDetalles(text) {
  const result = {
    emoji: '🏝️',
    duration_nights: '1',
    tipo: 'Playa, snorkel y relax',
    itinerary: [],
    includes: [],
    excludes: []
  }
  
  if (!text) return result
  
  const lines = text.split('\n')
  
  // Extract emoji from first line if possible
  const firstLine = lines[0] || ''
  const emojiMatch = firstLine.match(/^([^\w\s\d,.\-–()/]+)/u)
  if (emojiMatch) {
    result.emoji = emojiMatch[1].trim()
  }
  
  let currentSection = null
  let currentDayIdx = -1
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()
    if (!trimmedLine) continue
    
    // Check for Duración
    if (trimmedLine.startsWith('Duración:')) {
      const match = trimmedLine.match(/\/ (\d+) noche/)
      if (match) {
        result.duration_nights = match[1]
      }
      continue
    }
    
    // Check for Tipo
    if (trimmedLine.startsWith('Tipo:')) {
      result.tipo = trimmedLine.replace('Tipo:', '').trim()
      continue
    }
    
    // Check section transitions
    const dayMatch = trimmedLine.match(/^Día\s+(\d+):/i)
    if (dayMatch) {
      currentSection = 'itinerary'
      currentDayIdx = parseInt(dayMatch[1], 10) - 1
      while (result.itinerary.length <= currentDayIdx) {
        result.itinerary.push({ events: [] })
      }
      continue
    }
    
    if (trimmedLine.toLowerCase() === 'incluye:') {
      currentSection = 'includes'
      continue
    }
    
    if (trimmedLine.toLowerCase() === 'no incluye:') {
      currentSection = 'excludes'
      continue
    }
    
    // Parse items within sections
    if (currentSection === 'itinerary' && currentDayIdx >= 0) {
      const eventMatch = line.match(/^\s*(\d{2}:\d{2})\s*–\s*(.*)$/)
      if (eventMatch) {
        result.itinerary[currentDayIdx].events.push({
          time: eventMatch[1],
          description: eventMatch[2].trim()
        })
      } else {
        const eventMatch2 = line.match(/^\s*([^\s]+)\s*–\s*(.*)$/)
        if (eventMatch2) {
          result.itinerary[currentDayIdx].events.push({
            time: eventMatch2[1],
            description: eventMatch2[2].trim()
          })
        }
      }
    } else if (currentSection === 'includes') {
      result.includes.push(trimmedLine.replace(/^[\s]*[-–•·]\s*/, ''))
    } else if (currentSection === 'excludes') {
      result.excludes.push(trimmedLine.replace(/^[\s]*[-–•·]\s*/, ''))
    }
  }
  
  // Defaults if parsing left things empty
  if (result.itinerary.length === 0) {
    result.itinerary = [{ events: [{ time: '10:00', description: 'Llegada e inicio del recorrido' }] }]
  }
  if (result.includes.length === 0) {
    result.includes = ['']
  }
  if (result.excludes.length === 0) {
    result.excludes = ['']
  }
  
  return result
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('destinations') // 'destinations' | 'packages'
  
  // Data lists
  const [destinations, setDestinations] = useState([])
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(false)
  const [packages, setPackages] = useState([])
  const [isLoadingPackages, setIsLoadingPackages] = useState(false)
  
  // Feedback states
  const [statusMessage, setStatusMessage] = useState(null) // { type: 'success' | 'error', text: '' }
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Editing state
  const [isEditingDest, setIsEditingDest] = useState(false)
  const [editDestId, setEditDestId] = useState(null)
  const [isEditingPkg, setIsEditingPkg] = useState(false)
  const [editPkgId, setEditPkgId] = useState(null)

  // Destination Form State
  const [destForm, setDestForm] = useState({
    name: '',
    country: '',
    description: '',
    hero_image_url: '',
  })

  // Package Form State
  const [pkgForm, setPkgForm] = useState({
    destination_id: '',
    title: '',
    price: '',
    duration_days: '2',
    duration_nights: '1',
    is_all_inclusive: false,
    emoji: '🏝️',
    tipo: 'Playa, snorkel y relax',
  })

  // Package details builder state
  const [itinerary, setItinerary] = useState([
    {
      events: [
        { time: '10:00', description: 'Llegada e inicio del recorrido' },
      ],
    },
  ])
  const [includes, setIncludes] = useState([''])
  const [excludes, setExcludes] = useState([''])

  // --- Auth & JWT states ---
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [authError, setAuthError] = useState(null)

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) {
      setAuthError('Por favor, ingresa correo y contraseña.')
      return
    }

    setIsLoggingIn(true)
    setAuthError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })

      if (error) {
        throw new Error(error.message === 'Invalid login credentials' 
          ? 'Credenciales de acceso inválidas. Revisa tu correo y contraseña.' 
          : error.message
        )
      }

      // Check if session is valid and roles are correct
      const currentSession = data.session
      if (!currentSession) {
        throw new Error('No se pudo establecer la sesión.')
      }

      const token = currentSession.access_token
      const isValid = validateSessionToken(token)
      if (!isValid) {
        await supabase.auth.signOut()
        throw new Error('El token de sesión generado no es válido.')
      }

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentSession.user.id)
        .single()

      if (profileErr || !profile || profile.role !== 'admin') {
        await supabase.auth.signOut()
        throw new Error('Acceso denegado. Este usuario no tiene rol de administrador.')
      }

      // Successful login
      setSession(currentSession)
      setIsAdmin(true)
      setLoginEmail('')
      setLoginPassword('')
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setIsLoggingIn(false)
    }
  }

  useEffect(() => {
    let active = true

    async function checkAuth(currentSession) {
      if (!currentSession) {
        if (active) {
          setSession(null)
          setIsAdmin(false)
          setIsCheckingAuth(false)
        }
        return
      }

      const token = currentSession.access_token
      const isValid = validateSessionToken(token)

      if (!isValid) {
        if (active) {
          setAuthError('Tu sesión ha expirado o no es válida.')
          setSession(null)
          setIsAdmin(false)
          setIsCheckingAuth(false)
        }
        await supabase.auth.signOut()
        return
      }

      // Valid token, now check profile role
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentSession.user.id)
          .single()

        if (error || !profile || profile.role !== 'admin') {
          if (active) {
            setAuthError('Acceso denegado. No tienes privilegios de administrador.')
            setSession(null)
            setIsAdmin(false)
            setIsCheckingAuth(false)
          }
          await supabase.auth.signOut()
          return
        }

        if (active) {
          setSession(currentSession)
          setIsAdmin(true)
          setAuthError(null)
          setIsCheckingAuth(false)
        }
      } catch (err) {
        console.error('Error checking user profile:', err)
        if (active) {
          setAuthError('Error al validar tu rol de usuario.')
          setSession(null)
          setIsAdmin(false)
          setIsCheckingAuth(false)
        }
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAuth(session)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (_event === 'SIGNED_OUT') {
        if (active) {
          setSession(null)
          setIsAdmin(false)
          setIsCheckingAuth(false)
        }
      } else if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED') {
        checkAuth(newSession)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  // Load data when authenticated as admin
  useEffect(() => {
    if (isAdmin) {
      fetchDestinations()
      fetchPackages()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  async function fetchDestinations() {
    try {
      setIsLoadingDestinations(true)
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      setDestinations(data || [])
      
      // Auto select first destination if available
      if (data && data.length > 0 && !pkgForm.destination_id) {
        setPkgForm((prev) => ({ ...prev, destination_id: data[0].id }))
      }
    } catch (err) {
      console.error('Error fetching destinations:', err)
    } finally {
      setIsLoadingDestinations(false)
    }
  }

  async function fetchPackages() {
    try {
      setIsLoadingPackages(true)
      const { data, error } = await supabase
        .from('packages')
        .select('*, destinations(name, country)')
        .order('created_at', { ascending: false })
      if (error) throw error
      setPackages(data || [])
    } catch (err) {
      console.error('Error fetching packages:', err)
    } finally {
      setIsLoadingPackages(false)
    }
  }

  // ── Form handlers ─────────────────────────────────
  
  const handleDestChange = (e) => {
    const { name, value } = e.target
    setDestForm((prev) => ({ ...prev, [name]: value }))
  }

  const handlePkgChange = (e) => {
    const { name, value, type, checked } = e.target
    setPkgForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  // ── Itinerary Builder helpers ──────────────────────
  
  const addDay = () => {
    setItinerary((prev) => [...prev, { events: [{ time: '09:00', description: '' }] }])
  }

  const removeDay = (dayIndex) => {
    if (itinerary.length === 1) return
    setItinerary((prev) => prev.filter((_, idx) => idx !== dayIndex))
  }

  const addEvent = (dayIndex) => {
    setItinerary((prev) =>
      prev.map((day, idx) => {
        if (idx !== dayIndex) return day
        return {
          ...day,
          events: [...day.events, { time: '12:00', description: '' }],
        }
      })
    )
  }

  const removeEvent = (dayIndex, eventIndex) => {
    setItinerary((prev) =>
      prev.map((day, idx) => {
        if (idx !== dayIndex) return day
        return {
          ...day,
          events: day.events.filter((_, eIdx) => eIdx !== eventIndex),
        }
      })
    )
  }

  const handleEventChange = (dayIndex, eventIndex, field, value) => {
    setItinerary((prev) =>
      prev.map((day, idx) => {
        if (idx !== dayIndex) return day
        return {
          ...day,
          events: day.events.map((event, eIdx) => {
            if (eIdx !== eventIndex) return event
            return { ...event, [field]: value }
          }),
        }
      })
    )
  }

  // ── Include/Exclude Builders ─────────────────────
  
  const handleListChange = (index, value, type) => {
    const list = type === 'includes' ? includes : excludes
    const setter = type === 'includes' ? setIncludes : setExcludes
    
    const updated = [...list]
    updated[index] = value
    setter(updated)
  }

  const addListItem = (type) => {
    const list = type === 'includes' ? includes : excludes
    const setter = type === 'includes' ? setIncludes : setExcludes
    setter([...list, ''])
  }

  const removeListItem = (index, type) => {
    const list = type === 'includes' ? includes : excludes
    const setter = type === 'includes' ? setIncludes : setExcludes
    if (list.length === 1) {
      setter([''])
      return
    }
    setter(list.filter((_, idx) => idx !== index))
  }

  // ── Serialization & Submission ────────────────────
  
  const serializeDetalles = () => {
    const selectedDest = destinations.find((d) => d.id === pkgForm.destination_id)
    const destLabel = selectedDest
      ? `${selectedDest.name} – ${selectedDest.country}`
      : 'Destino'

    let detailsStr = `${pkgForm.emoji} ${pkgForm.title} – ${destLabel} (paquete de ${pkgForm.duration_days} días / ${pkgForm.duration_nights} noche)\n\n`
    detailsStr += `Duración: ${pkgForm.duration_days} días / ${pkgForm.duration_nights} noche\n`
    detailsStr += `Tipo: ${pkgForm.tipo}\n`

    itinerary.forEach((day, index) => {
      detailsStr += `\nDía ${index + 1}:\n`
      day.events.forEach((event) => {
        if (event.time && event.description) {
          detailsStr += `\n    ${event.time} – ${event.description}\n`
        }
      })
    })

    const filteredIncludes = includes.filter((item) => item.trim() !== '')
    if (filteredIncludes.length > 0) {
      detailsStr += `\nIncluye:\n`
      filteredIncludes.forEach((item) => {
        detailsStr += `\n    ${item}\n`
      })
    }

    const filteredExcludes = excludes.filter((item) => item.trim() !== '')
    if (filteredExcludes.length > 0) {
      detailsStr += `\nNo incluye:\n`
      filteredExcludes.forEach((item) => {
        detailsStr += `\n    ${item}\n`
      })
    }

    return detailsStr
  }

  const handleDestSubmit = async (e) => {
    e.preventDefault()
    if (!destForm.name || !destForm.country) {
      showStatus('error', 'Por favor, completa los campos obligatorios de Destino.')
      return
    }

    setIsSubmitting(true)
    setStatusMessage(null)

    try {
      let error
      if (isEditingDest) {
        const { error: err } = await supabase
          .from('destinations')
          .update(destForm)
          .eq('id', editDestId)
        error = err
      } else {
        const { error: err } = await supabase.from('destinations').insert([destForm])
        error = err
      }
      if (error) throw error

      showStatus('success', isEditingDest ? '¡Destino actualizado exitosamente!' : '¡Destino creado exitosamente!')
      setDestForm({
        name: '',
        country: '',
        description: '',
        hero_image_url: '',
      })
      setIsEditingDest(false)
      setEditDestId(null)
      await fetchDestinations()
      await fetchPackages()
    } catch (err) {
      showStatus('error', `Error al guardar el destino: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePkgSubmit = async (e) => {
    e.preventDefault()
    if (!pkgForm.destination_id || !pkgForm.title || !pkgForm.price) {
      showStatus('error', 'Por favor, completa los campos obligatorios del Paquete.')
      return
    }

    setIsSubmitting(true)
    setStatusMessage(null)

    const serializedDetails = serializeDetalles()

    try {
      const payload = {
        destination_id: pkgForm.destination_id,
        title: pkgForm.title,
        price: parseFloat(pkgForm.price),
        duration_days: parseInt(pkgForm.duration_days, 10),
        is_all_inclusive: pkgForm.is_all_inclusive,
        Detalles: serializedDetails,
      }

      let error
      if (isEditingPkg) {
        const { error: err } = await supabase
          .from('packages')
          .update(payload)
          .eq('id', editPkgId)
        error = err
      } else {
        const { error: err } = await supabase.from('packages').insert([payload])
        error = err
      }
      if (error) throw error

      showStatus('success', isEditingPkg ? '¡Paquete actualizado exitosamente!' : '¡Paquete creado y formateado exitosamente!')
      
      // Reset form
      setPkgForm((prev) => ({
        ...prev,
        title: '',
        price: '',
        is_all_inclusive: false,
      }))
      setItinerary([
        {
          events: [{ time: '10:00', description: 'Llegada e inicio del recorrido' }],
        },
      ])
      setIncludes([''])
      setExcludes([''])
      setIsEditingPkg(false)
      setEditPkgId(null)
      await fetchPackages()
    } catch (err) {
      showStatus('error', `Error al guardar el paquete: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditDest = (dest) => {
    setDestForm({
      name: dest.name,
      country: dest.country,
      description: dest.description || '',
      hero_image_url: dest.hero_image_url || '',
    })
    setIsEditingDest(true)
    setEditDestId(dest.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEditDest = () => {
    setDestForm({
      name: '',
      country: '',
      description: '',
      hero_image_url: '',
    })
    setIsEditingDest(false)
    setEditDestId(null)
  }

  const handleEditPkg = (pkg) => {
    const parsed = deserializeDetalles(pkg.Detalles)
    setPkgForm({
      destination_id: pkg.destination_id || '',
      title: pkg.title || '',
      price: pkg.price ? pkg.price.toString() : '',
      duration_days: pkg.duration_days ? pkg.duration_days.toString() : '2',
      duration_nights: parsed.duration_nights || '1',
      is_all_inclusive: pkg.is_all_inclusive || false,
      emoji: parsed.emoji || '🏝️',
      tipo: parsed.tipo || 'Playa, snorkel y relax',
    })
    setItinerary(parsed.itinerary)
    setIncludes(parsed.includes)
    setExcludes(parsed.excludes)
    setIsEditingPkg(true)
    setEditPkgId(pkg.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEditPkg = () => {
    setPkgForm((prev) => ({
      ...prev,
      title: '',
      price: '',
      is_all_inclusive: false,
    }))
    setItinerary([
      {
        events: [{ time: '10:00', description: 'Llegada e inicio del recorrido' }],
      },
    ])
    setIncludes([''])
    setExcludes([''])
    setIsEditingPkg(false)
    setEditPkgId(null)
  }

  const handleDeleteDest = async (id, name) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el destino "${name}"? Esto podría fallar si tiene paquetes asociados.`)) {
      return
    }

    try {
      setIsSubmitting(true)
      const { error } = await supabase.from('destinations').delete().eq('id', id)
      if (error) throw error

      showStatus('success', '¡Destino eliminado exitosamente!')
      if (editDestId === id) {
        handleCancelEditDest()
      }
      await fetchDestinations()
      await fetchPackages()
    } catch (err) {
      showStatus('error', `Error al eliminar destino: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePkg = async (id, title) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el paquete "${title}"?`)) {
      return
    }

    try {
      setIsSubmitting(true)
      const { error } = await supabase.from('packages').delete().eq('id', id)
      if (error) throw error

      showStatus('success', '¡Paquete eliminado exitosamente!')
      if (editPkgId === id) {
        handleCancelEditPkg()
      }
      await fetchPackages()
    } catch (err) {
      showStatus('error', `Error al eliminar paquete: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const showStatus = (type, text) => {
    setStatusMessage({ type, text })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1),transparent_60%)] pointer-events-none" />
        <div className="z-10 flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-cyan-400" size={40} />
          <p className="text-slate-400 text-sm tracking-wider animate-pulse">Verificando sesión segura...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-xl shadow-cyan-500/20">
              <ShieldCheck size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Alco<span className="text-cyan-400">viajes</span>
            </h1>
            <p className="text-sm text-slate-400 mt-2">Portal de Administración Seguro</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-xl p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Iniciar Sesión</h2>

            {authError && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300 animate-in shake duration-300">
                <AlertTriangle size={18} className="shrink-0 text-red-400 mt-0.5" />
                <div className="text-xs leading-relaxed">{authError}</div>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@alcoviajes.com"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 pl-10 pr-10 py-3 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 px-6 font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  'Ingresar al Dashboard'
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-1.5">
              <ArrowLeft size={12} /> Volver al sitio principal
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar / Navigation header */}
      <div className="border-b border-white/10 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              to="/destinos"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Alcoviajes <span className="text-cyan-400 font-medium">Dashboard</span>
              </h1>
              <p className="text-xs text-slate-400">Creador de Destinos y Paquetes Estructurados</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-slate-950 p-1 border border-white/5">
              <button
                onClick={() => { setActiveTab('destinations'); setStatusMessage(null); }}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === 'destinations'
                    ? 'bg-cyan-500/10 text-cyan-400 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <MapPin size={16} />
                Destinos
              </button>
              <button
                onClick={() => { setActiveTab('packages'); setStatusMessage(null); }}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === 'packages'
                    ? 'bg-cyan-500/10 text-cyan-400 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Package size={16} />
                Paquetes
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-white/5">
              <span className="text-xs text-slate-300 font-medium">{session?.user?.email}</span>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                Admin
              </span>
            </div>

            <button
              onClick={() => supabase.auth.signOut()}
              className="flex h-10 w-10 lg:w-auto lg:px-4 items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-800 text-slate-300 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 transition-all font-semibold text-xs active:scale-[0.98]"
              title="Cerrar sesión"
            >
              <LogOut size={14} />
              <span className="hidden lg:inline">Salir</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Status Message */}
        {statusMessage && (
          <div
            className={`mb-8 flex items-start gap-3 rounded-2xl border p-4 animate-in fade-in slide-in-from-top-4 duration-300 ${
              statusMessage.type === 'success'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                : 'border-red-500/20 bg-red-500/10 text-red-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle size={20} className="shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle size={20} className="shrink-0 text-red-400" />
            )}
            <div>
              <p className="text-sm font-semibold">
                {statusMessage.type === 'success' ? 'Éxito' : 'Error'}
              </p>
              <p className="text-sm opacity-90">{statusMessage.text}</p>
            </div>
          </div>
        )}

        {/* ── TAB 1: DESTINATIONS ──────────────────────────────────── */}
        {activeTab === 'destinations' && (
          <div className="space-y-8">
            <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6 md:p-8 backdrop-blur-md shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <MapPin className="text-cyan-400" size={22} />
                {isEditingDest ? 'Editar Destino' : 'Agregar Nuevo Destino'}
              </h2>
              
              <form onSubmit={handleDestSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Nombre del Destino <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={destForm.name}
                      onChange={handleDestChange}
                      required
                      placeholder="Ej: Isla Mujeres, Presidente Franco"
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      País <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={destForm.country}
                      onChange={handleDestChange}
                      required
                      placeholder="Ej: México, Paraguay"
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    URL de la Imagen Principal (Hero Image)
                  </label>
                  <input
                    type="url"
                    name="hero_image_url"
                    value={destForm.hero_image_url}
                    onChange={handleDestChange}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                  />
                  <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                    <Info size={12} /> Se recomienda un enlace de imagen pública de Unsplash.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Descripción del Destino
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    value={destForm.description}
                    onChange={handleDestChange}
                    placeholder="Describe los atractivos principales, historia breve y qué lo hace único..."
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all resize-none"
                  />
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 px-6 font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Save size={18} />
                    )}
                    {isEditingDest ? 'Actualizar Destino' : 'Guardar Destino'}
                  </button>
                  {isEditingDest && (
                    <button
                      type="button"
                      onClick={handleCancelEditDest}
                      className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900 py-3.5 px-6 font-semibold text-slate-300 hover:bg-slate-800 hover:text-white active:scale-[0.98] transition-all"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Destinos Existentes */}
            <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6 md:p-8 backdrop-blur-md shadow-2xl space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MapPin className="text-cyan-400" size={20} />
                Destinos Existentes ({destinations.length})
              </h2>

              {isLoadingDestinations ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="animate-spin text-cyan-400" size={28} />
                  <p className="text-sm text-slate-400">Cargando destinos...</p>
                </div>
              ) : destinations.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No hay destinos guardados aún.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {destinations.map((dest) => (
                    <div
                      key={dest.id}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-slate-950 p-5 hover:border-cyan-500/30 transition-all duration-300"
                    >
                      <div>
                        {dest.hero_image_url && (
                          <div className="mb-4 h-32 w-full overflow-hidden rounded-xl bg-slate-900">
                            <img
                              src={dest.hero_image_url}
                              alt={dest.name}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-white text-lg">{dest.name}</h3>
                            <span className="text-xs text-cyan-400 font-semibold uppercase tracking-wider">
                              {dest.country}
                            </span>
                          </div>
                        </div>
                        {dest.description && (
                          <p className="mt-2 text-sm text-slate-400 line-clamp-2">
                            {dest.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-6 flex items-center justify-end gap-2 border-t border-white/5 pt-4">
                        <button
                          onClick={() => handleEditDest(dest)}
                          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                        >
                          <Pencil size={13} />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteDest(dest.id, dest.name)}
                          className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all"
                        >
                          <Trash size={13} />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: PACKAGES ──────────────────────────────────────── */}
        {activeTab === 'packages' && (
          <div className="space-y-8">
            <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6 md:p-8 backdrop-blur-md shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Package className="text-cyan-400" size={22} />
                {isEditingPkg ? 'Editar Paquete' : 'Agregar Nuevo Paquete'}
              </h2>

              {isLoadingDestinations ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="animate-spin text-cyan-400" size={28} />
                  <p className="text-sm text-slate-400">Cargando destinos...</p>
                </div>
              ) : destinations.length === 0 ? (
                <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-6 text-center">
                  <AlertTriangle className="mx-auto text-yellow-400 mb-2" size={28} />
                  <p className="text-yellow-300 font-medium">No hay destinos registrados.</p>
                  <p className="text-xs text-yellow-400/80 mt-1">Crea un destino primero en la pestaña de Destinos antes de armar paquetes.</p>
                </div>
              ) : (
                <form onSubmit={handlePkgSubmit} className="space-y-8">
                  {/* Basic fields */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-400/80 border-b border-white/5 pb-2">
                      Información General
                    </h3>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Destino Asociado <span className="text-red-400">*</span>
                        </label>
                        <select
                          name="destination_id"
                          value={pkgForm.destination_id}
                          onChange={handlePkgChange}
                          required
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:border-cyan-500 outline-none transition-all"
                        >
                          {destinations.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({d.country})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Título del Paquete <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={pkgForm.title}
                          onChange={handlePkgChange}
                          required
                          placeholder="Ej: Aventura Extrema, Relax Completo"
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Precio por Persona (USD) <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="price"
                          value={pkgForm.price}
                          onChange={handlePkgChange}
                          required
                          placeholder="Ej: 150.00"
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Duración en Días
                        </label>
                        <input
                          type="number"
                          name="duration_days"
                          value={pkgForm.duration_days}
                          onChange={handlePkgChange}
                          required
                          min="1"
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Cantidad de Noches
                        </label>
                        <input
                          type="number"
                          name="duration_nights"
                          value={pkgForm.duration_nights}
                          onChange={handlePkgChange}
                          required
                          min="0"
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3 items-center">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Emoji Temático
                        </label>
                        <input
                          type="text"
                          name="emoji"
                          maxLength="4"
                          value={pkgForm.emoji}
                          onChange={handlePkgChange}
                          placeholder="Ej: 🏝️, 🏞️, 🌋"
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-center text-lg"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Tipo de Viaje (Subtítulo)
                        </label>
                        <input
                          type="text"
                          name="tipo"
                          value={pkgForm.tipo}
                          onChange={handlePkgChange}
                          placeholder="Ej: Playa, aventura y caminata"
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-5 py-4">
                      <input
                        type="checkbox"
                        id="is_all_inclusive"
                        name="is_all_inclusive"
                        checked={pkgForm.is_all_inclusive}
                        onChange={handlePkgChange}
                        className="h-5 w-5 rounded border-white/10 bg-slate-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950"
                      />
                      <label htmlFor="is_all_inclusive" className="text-sm font-medium text-slate-200 cursor-pointer select-none">
                        Marcar como paquete **Todo Incluido (All Inclusive)**
                      </label>
                    </div>
                  </div>

                  {/* Itinerary Builder */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-400/80">
                        Itinerario por Días
                      </h3>
                      <button
                        type="button"
                        onClick={addDay}
                        className="flex items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20 active:scale-95 transition-all"
                      >
                        <Plus size={14} />
                        Agregar Día
                      </button>
                    </div>

                    <div className="space-y-6">
                      {itinerary.map((day, dayIdx) => (
                        <div
                          key={dayIdx}
                          className="rounded-2xl border border-white/5 bg-slate-950 p-5 space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white bg-slate-800 px-3 py-1 rounded-lg">
                              Día {dayIdx + 1}
                            </span>
                            {itinerary.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeDay(dayIdx)}
                                className="text-slate-500 hover:text-red-400 transition-colors p-1"
                                title="Eliminar Día"
                              >
                                <Trash size={16} />
                              </button>
                            )}
                          </div>

                          <div className="space-y-3">
                            {day.events.map((event, eventIdx) => (
                              <div
                                key={eventIdx}
                                className="flex flex-wrap md:flex-nowrap gap-3 items-center"
                              >
                                <input
                                  type="text"
                                  placeholder="09:00"
                                  value={event.time}
                                  onChange={(e) =>
                                    handleEventChange(
                                      dayIdx,
                                      eventIdx,
                                      'time',
                                      e.target.value
                                    )
                                  }
                                  className="w-24 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none text-center"
                                />
                                <input
                                  type="text"
                                  placeholder="Ferry de regreso / Snorkel en parque..."
                                  value={event.description}
                                  onChange={(e) =>
                                    handleEventChange(
                                      dayIdx,
                                      eventIdx,
                                      'description',
                                      e.target.value
                                    )
                                  }
                                  className="flex-1 min-w-[200px] rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                                />
                                {day.events.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeEvent(dayIdx, eventIdx)
                                    }
                                    className="text-slate-600 hover:text-red-400 transition-colors p-1.5"
                                  >
                                    <Trash size={14} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => addEvent(dayIdx)}
                            className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
                          >
                            <PlusCircle size={14} />
                            Añadir Actividad / Hora
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Incluye / No Incluye Builders */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Incluye */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
                          Incluye
                        </h3>
                        <button
                          type="button"
                          onClick={() => addListItem('includes')}
                          className="flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all"
                        >
                          <Plus size={12} />
                          Agregar
                        </button>
                      </div>

                      <div className="space-y-2">
                        {includes.map((item, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) =>
                                handleListChange(idx, e.target.value, 'includes')
                              }
                              placeholder="Ej: Desayuno incluido en el hotel"
                              className="flex-1 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => removeListItem(idx, 'includes')}
                              className="text-slate-600 hover:text-red-400 transition-colors p-1.5"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* No Incluye */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-red-400">
                          No Incluye
                        </h3>
                        <button
                          type="button"
                          onClick={() => addListItem('excludes')}
                          className="flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20 active:scale-95 transition-all"
                        >
                          <Plus size={12} />
                          Agregar
                        </button>
                      </div>

                      <div className="space-y-2">
                        {excludes.map((item, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) =>
                                handleListChange(idx, e.target.value, 'excludes')
                              }
                              placeholder="Ej: Propinas y compras personales"
                              className="flex-1 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => removeListItem(idx, 'excludes')}
                              className="text-slate-600 hover:text-red-400 transition-colors p-1.5"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Submission */}
                  <div className="pt-6 flex flex-col sm:flex-row gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 px-6 font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : isEditingPkg ? (
                        <Save size={18} />
                      ) : (
                        <Sparkles size={18} />
                      )}
                      {isEditingPkg ? 'Actualizar Paquete' : 'Crear y Publicar Paquete'}
                    </button>
                    {isEditingPkg && (
                      <button
                        type="button"
                        onClick={handleCancelEditPkg}
                        className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900 py-3.5 px-6 font-semibold text-slate-300 hover:bg-slate-800 hover:text-white active:scale-[0.98] transition-all"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>

            {/* Paquetes Existentes */}
            <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6 md:p-8 backdrop-blur-md shadow-2xl space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Package className="text-cyan-400" size={20} />
                Paquetes Existentes ({packages.length})
              </h2>

              {isLoadingPackages ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="animate-spin text-cyan-400" size={28} />
                  <p className="text-sm text-slate-400">Cargando paquetes...</p>
                </div>
              ) : packages.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No hay paquetes guardados aún.
                </div>
              ) : (
                <div className="space-y-4">
                  {packages.map((pkg) => {
                    const parsed = deserializeDetalles(pkg.Detalles)
                    return (
                      <div
                        key={pkg.id}
                        className="group flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-white/5 bg-slate-950 p-5 hover:border-cyan-500/30 transition-all duration-300"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-3xl p-2 bg-slate-900 rounded-xl block">
                            {parsed.emoji || '🏝️'}
                          </span>
                          <div>
                            <h3 className="font-bold text-white text-base group-hover:text-cyan-400 transition-colors">
                              {pkg.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-slate-400">
                              <span className="font-semibold text-slate-300">
                                {pkg.destinations?.name || 'Destino desconocido'}
                              </span>
                              <span>•</span>
                              <span>
                                {pkg.duration_days} {pkg.duration_days === 1 ? 'día' : 'días'}
                              </span>
                              <span>•</span>
                              <span className="text-cyan-400 font-semibold">${pkg.price} USD</span>
                              {pkg.is_all_inclusive && (
                                <>
                                  <span>•</span>
                                  <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                                    Todo Incluido
                                  </span>
                                </>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                              {parsed.tipo}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-center border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                          <button
                            onClick={() => handleEditPkg(pkg)}
                            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                          >
                            <Pencil size={13} />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeletePkg(pkg.id, pkg.title)}
                            className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all"
                          >
                            <Trash size={13} />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
