import { useAuth } from '../context/AuthContext'
import { User, LogOut, Loader2 } from 'lucide-react'

export default function DashboardUsuario() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={32} className="animate-spin text-cyan-400" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 pt-24">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
            <User size={28} />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-white">
            Inicia sesión
          </h1>
          <p className="text-slate-400">
            Necesitas estar autenticado para acceder a tu dashboard.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-6 pt-28 pb-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Hola, {user.email?.split('@')[0]} 👋
            </h1>
            <p className="mt-1 text-slate-400">{user.email}</p>
          </div>
          <button
            id="dashboard-signout"
            onClick={signOut}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition-colors hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>

        <div className="rounded-2xl border border-white/5 bg-slate-800/50 p-8">
          <h2 className="mb-4 text-xl font-semibold text-white">
            Tus Reservas
          </h2>
          <p className="text-slate-400">
            Aún no tienes reservas. ¡Explora nuestros destinos y reserva tu
            próximo viaje!
          </p>
        </div>
      </div>
    </div>
  )
}
