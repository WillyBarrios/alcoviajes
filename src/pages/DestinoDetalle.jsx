import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Loader2,
  Package,
  Calendar,
  DollarSign,
  ImageOff,
} from 'lucide-react'
import { useDestination } from '../hooks/useDestinations'
import { usePackages } from '../hooks/usePackages'

export default function DestinoDetalle() {
  const { id } = useParams()
  const { destination, isLoading: destLoading, error: destError } = useDestination(id)
  const { packages, isLoading: pkgLoading, error: pkgError } = usePackages(id)
  const [imgError, setImgError] = useState(false)

  /* ── Loading state ─────────────────────────────────── */
  if (destLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={32} className="animate-spin text-cyan-400" />
      </div>
    )
  }

  /* ── Error state ───────────────────────────────────── */
  if (destError || !destination) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 pt-24">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold text-white">
            Destino no encontrado
          </h1>
          <p className="mb-6 text-slate-400">
            {destError || 'No pudimos encontrar este destino.'}
          </p>
          <Link
            to="/destinos"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/10 px-6 py-3 text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20"
          >
            <ArrowLeft size={16} />
            Volver a Destinos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* ── Hero banner ──────────────────────────────── */}
      <section className="relative h-[50vh] min-h-[360px] overflow-hidden">
        {destination.hero_image_url && !imgError ? (
          <img
            src={destination.hero_image_url}
            alt={destination.name}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-800 to-slate-900">
            <ImageOff size={48} className="text-slate-600" />
            <span className="text-sm text-slate-500">Imagen no disponible</span>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Content on top of hero */}
        <div className="absolute inset-0 flex flex-col justify-end px-6 pb-10">
          <div className="mx-auto w-full max-w-6xl">
            {/* Back link */}
            <Link
              to="/destinos"
              id="back-to-destinos"
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-900/50 px-4 py-2 text-sm text-white backdrop-blur-sm transition-colors hover:bg-slate-900/80"
            >
              <ArrowLeft size={14} />
              Destinos
            </Link>

            {/* Country badge */}
            {destination.country && (
              <div className="mb-3 flex items-center gap-2 text-cyan-400">
                <MapPin size={16} />
                <span className="text-sm font-medium uppercase tracking-wider">
                  {destination.country}
                </span>
              </div>
            )}

            <h1 className="text-4xl font-extrabold text-white md:text-6xl">
              {destination.name}
            </h1>
          </div>
        </div>
      </section>

      {/* ── Body ─────────────────────────────────────── */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          {/* Description */}
          <p className="mb-12 max-w-3xl text-lg leading-relaxed text-slate-300">
            {destination.description}
          </p>

          {/* ── Packages section ─────────────────────── */}
          <div>
            <h2 className="mb-2 text-2xl font-bold text-white md:text-3xl">
              Paquetes disponibles
            </h2>
            <p className="mb-8 text-slate-400">
              Elige el paquete que mejor se adapte a tu estilo de viaje.
            </p>

            {/* Packages loading */}
            {pkgLoading && (
              <div className="flex items-center justify-center gap-3 py-16">
                <Loader2 size={24} className="animate-spin text-cyan-400" />
                <p className="text-sm text-slate-400">Cargando paquetes…</p>
              </div>
            )}

            {/* Packages error */}
            {pkgError && (
              <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-center">
                <p className="text-sm text-red-300">{pkgError}</p>
              </div>
            )}

            {/* Empty packages */}
            {!pkgLoading && !pkgError && packages.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/5 bg-slate-800/50 py-16">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-700/50 text-slate-500">
                  <Package size={28} />
                </div>
                <p className="text-slate-400">
                  Próximamente — estamos preparando paquetes increíbles para{' '}
                  <span className="font-medium text-white">
                    {destination.name}
                  </span>.
                </p>
              </div>
            )}

            {/* Packages grid */}
            {!pkgLoading && !pkgError && packages.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {packages.map((pkg) => (
                  <Link
                    to={`/paquete/${pkg.id}`}
                    key={pkg.id}
                    id={`pkg-card-${pkg.id}`}
                    className="group rounded-2xl border border-white/5 bg-slate-800/50 p-6 transition-all hover:border-cyan-400/20 hover:shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1"
                  >
                    {/* Title */}
                    <h3 className="mb-3 text-lg font-bold text-white leading-snug">
                      {pkg.title}
                    </h3>

                    {/* Detalles preview */}
                    {pkg.Detalles && (
                      <p className="mb-4 text-sm leading-relaxed text-slate-400 line-clamp-2">
                        {pkg.Detalles.replace(/^[^\n]*\n\n/, '')}
                      </p>
                    )}

                    {/* Meta info row */}
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      {pkg.price != null && (
                        <span className="flex items-center gap-1 font-semibold text-emerald-400">
                          <DollarSign size={14} />
                          ${Number(pkg.price).toLocaleString('es-MX')}
                        </span>
                      )}
                      {pkg.duration_days && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar size={14} className="text-cyan-400" />
                          {pkg.duration_days} días
                        </span>
                      )}
                      {pkg.is_all_inclusive && (
                        <span className="rounded-full bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                          All Inclusive
                        </span>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-cyan-400 transition-colors group-hover:text-cyan-300">
                        Ver detalles
                        <ArrowRight
                          size={14}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
