import { MapPin, Loader2 } from 'lucide-react'
import { useDestinations } from '../hooks/useDestinations'
import DestinationCard from '../components/DestinationCard'

export default function Destinos() {
  const { destinations, isLoading, error } = useDestinations()

  return (
    <div className="min-h-screen px-6 pt-28 pb-16">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-extrabold text-white md:text-5xl">
            Nuestros{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Destinos
            </span>
          </h1>
          <p className="mx-auto max-w-xl text-slate-400">
            Explora nuestra selección de destinos y encuentra el viaje perfecto
            para ti.
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 py-32">
            <Loader2 size={32} className="animate-spin text-cyan-400" />
            <p className="text-sm text-slate-400">Cargando destinos…</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mx-auto max-w-md rounded-2xl border border-red-400/20 bg-red-400/10 p-8 text-center">
            <p className="mb-2 font-semibold text-red-300">
              Error al cargar destinos
            </p>
            <p className="text-sm text-red-300/70">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && destinations.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-32">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
              <MapPin size={28} />
            </div>
            <p className="text-slate-400">
              Aún no hay destinos disponibles. ¡Pronto agregaremos nuevos!
            </p>
          </div>
        )}

        {/* Destination grid */}
        {!isLoading && !error && destinations.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((dest) => (
              <DestinationCard key={dest.id} destination={dest} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
