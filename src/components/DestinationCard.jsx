import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, ArrowRight, ImageOff } from 'lucide-react'

/**
 * Reusable card component for displaying a destination preview.
 * Shows the hero image with graceful fallback on broken URLs.
 */
export default function DestinationCard({ destination }) {
  const [imgError, setImgError] = useState(false)
  const dest = destination

  const hasImage = dest.hero_image_url && !imgError

  return (
    <Link
      to={`/destinos/${dest.id}`}
      id={`dest-card-${dest.id}`}
      className="group block overflow-hidden rounded-2xl border border-white/5 bg-slate-800/50 transition-all hover:border-cyan-400/20 hover:shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1"
    >
      {/* Hero image with fallback */}
      <div className="relative h-52 overflow-hidden">
        {hasImage ? (
          <img
            src={dest.hero_image_url}
            alt={dest.name}
            onError={() => setImgError(true)}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-700/50 to-slate-800/80">
            <ImageOff size={32} className="text-slate-500" />
            <span className="text-xs text-slate-500">Sin imagen</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />

        {/* Country badge */}
        {dest.country && (
          <span className="absolute top-3 right-3 rounded-full border border-white/20 bg-slate-900/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {dest.country}
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="p-6">
        <div className="mb-2 flex items-center gap-2 text-cyan-400">
          <MapPin size={14} />
          <span className="text-xs font-medium uppercase tracking-wider">
            {dest.country || 'Destino'}
          </span>
        </div>
        <h3 className="mb-2 text-lg font-bold text-white">
          {dest.name}
        </h3>
        <p className="mb-4 text-sm leading-relaxed text-slate-400 line-clamp-2">
          {dest.description}
        </p>
        {/* CTA */}
        <span className="inline-flex items-center gap-1 text-sm font-medium text-cyan-400 transition-colors group-hover:text-cyan-300">
          Ver paquetes
          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-1"
          />
        </span>
      </div>
    </Link>
  )
}
