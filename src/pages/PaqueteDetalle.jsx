import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Loader2,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { usePackage } from '../hooks/usePackages'

/**
 * Parses the plain-text Detalles field into structured sections.
 * Splits on "\n\n" and groups lines under "Incluye:", "No incluye:", etc.
 */
function parseDetalles(text) {
  if (!text) return { header: '', sections: [] }

  const lines = text.split('\n')
  const header = lines[0] || ''

  const sections = []
  let current = null

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Detect section headers like "Itinerario:", "Incluye:", "No incluye:"
    if (
      line.endsWith(':') &&
      !line.startsWith(' ') &&
      line.length < 80
    ) {
      current = { title: line.replace(/:$/, ''), items: [] }
      sections.push(current)
    } else if (current) {
      // Remove leading bullets, dashes, numbers
      const cleaned = line.replace(/^[\s]*[-–•·]\s*/, '').replace(/^\d+\.\s*/, '')
      if (cleaned) current.items.push(cleaned)
    } else {
      // Lines before first section — treat as intro
      if (!sections.length || sections[sections.length - 1].title !== '__intro__') {
        current = { title: '__intro__', items: [] }
        sections.push(current)
      }
      current.items.push(line)
    }
  }

  return { header, sections }
}

export default function PaqueteDetalle() {
  const { id } = useParams()
  const { pkg, destination, isLoading, error } = usePackage(id)

  /* ── Loading ───────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={32} className="animate-spin text-cyan-400" />
      </div>
    )
  }

  /* ── Error / Not found ─────────────────────────── */
  if (error || !pkg) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 pt-24">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold text-white">
            Paquete no encontrado
          </h1>
          <p className="mb-6 text-slate-400">
            {error || 'No pudimos encontrar este paquete.'}
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

  const { header, sections } = parseDetalles(pkg.Detalles)

  return (
    <div className="min-h-screen px-6 pt-28 pb-16">
      <div className="mx-auto max-w-4xl">
        {/* Back navigation */}
        <Link
          to={destination ? `/destinos/${destination.id}` : '/destinos'}
          id="back-to-destination"
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition-colors hover:border-white/20 hover:bg-white/5"
        >
          <ArrowLeft size={14} />
          {destination ? destination.name : 'Destinos'}
        </Link>

        {/* ── Package header ───────────────────────── */}
        <div className="mb-10">
          {/* Title emoji header from Detalles */}
          {header && (
            <p className="mb-3 text-lg text-slate-400">{header}</p>
          )}

          <h1 className="mb-6 text-3xl font-extrabold text-white md:text-4xl">
            {pkg.title}
          </h1>

          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-4">
            {pkg.price != null && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-400/10 border border-emerald-400/20 px-4 py-2">
                <DollarSign size={18} className="text-emerald-400" />
                <div>
                  <p className="text-2xl font-bold text-emerald-400">
                    ${Number(pkg.price).toLocaleString('es-MX')}
                  </p>
                  <p className="text-xs text-emerald-400/70">por persona</p>
                </div>
              </div>
            )}

            {pkg.duration_days && (
              <div className="flex items-center gap-2 rounded-xl bg-cyan-400/10 border border-cyan-400/20 px-4 py-2">
                <Calendar size={18} className="text-cyan-400" />
                <div>
                  <p className="text-lg font-bold text-cyan-400">
                    {pkg.duration_days} días
                  </p>
                  <p className="text-xs text-cyan-400/70">duración</p>
                </div>
              </div>
            )}

            {destination && (
              <div className="flex items-center gap-2 rounded-xl bg-slate-800 border border-white/5 px-4 py-2">
                <MapPin size={18} className="text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-white">
                    {destination.name}
                  </p>
                  <p className="text-xs text-slate-400">{destination.country}</p>
                </div>
              </div>
            )}

            {pkg.is_all_inclusive && (
              <span className="rounded-full bg-emerald-400/10 border border-emerald-400/20 px-4 py-2 text-sm font-semibold text-emerald-400">
                ✨ All Inclusive
              </span>
            )}
          </div>
        </div>

        {/* ── Detalles sections ────────────────────── */}
        {sections.length > 0 && (
          <div className="space-y-8">
            {sections.map((section, idx) => {
              // Skip the intro section header
              if (section.title === '__intro__') {
                return (
                  <div key={idx} className="space-y-2">
                    {section.items.map((item, i) => (
                      <p key={i} className="text-slate-300">{item}</p>
                    ))}
                  </div>
                )
              }

              const isIncluye = section.title.toLowerCase().includes('incluye')
                && !section.title.toLowerCase().includes('no incluye')
              const isNoIncluye = section.title.toLowerCase().includes('no incluye')

              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/5 bg-slate-800/50 p-6 md:p-8"
                >
                  <h2 className="mb-4 text-xl font-bold text-white">
                    {section.title}
                  </h2>
                  <ul className="space-y-3">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        {isIncluye ? (
                          <CheckCircle
                            size={18}
                            className="mt-0.5 shrink-0 text-emerald-400"
                          />
                        ) : isNoIncluye ? (
                          <XCircle
                            size={18}
                            className="mt-0.5 shrink-0 text-red-400"
                          />
                        ) : (
                          <span className="mt-1 shrink-0 h-2 w-2 rounded-full bg-cyan-400" />
                        )}
                        <span className="text-slate-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        )}

        {/* ── No Detalles fallback ─────────────────── */}
        {!pkg.Detalles && (
          <div className="rounded-2xl border border-white/5 bg-slate-800/50 p-8 text-center">
            <p className="text-slate-400">
              Los detalles de este paquete estarán disponibles pronto.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
