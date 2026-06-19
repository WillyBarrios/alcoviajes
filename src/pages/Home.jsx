import { ArrowRight, MapPin, Shield, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const features = [
  {
    icon: MapPin,
    title: 'Destinos Exclusivos',
    description:
      'Descubre lugares únicos seleccionados por nuestros expertos en viajes.',
  },
  {
    icon: Shield,
    title: 'Reserva Segura',
    description:
      'Tu información y pagos protegidos con la más alta seguridad.',
  },
  {
    icon: Sparkles,
    title: 'Experiencias Únicas',
    description:
      'Paquetes personalizados que se adaptan a tu estilo de viaje.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="pointer-events-none absolute -right-40 -bottom-40 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-medium text-cyan-300">
            <Sparkles size={14} />
            Tu próxima aventura comienza aquí
          </span>

          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-white md:text-7xl">
            Viaja sin{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              límites
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-400 md:text-xl">
            Descubre destinos increíbles, arma tu paquete ideal y reserva en
            minutos. Alcoviajes te lleva a donde siempre soñaste.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/destinos"
              id="hero-cta"
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-105"
            >
              Explorar Destinos
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative border-t border-white/5 bg-slate-900/50 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-white md:text-4xl">
            ¿Por qué elegir{' '}
            <span className="text-cyan-400">Alcoviajes</span>?
          </h2>
          <p className="mx-auto mb-16 max-w-xl text-center text-slate-400">
            Combinamos tecnología y pasión por los viajes para ofrecerte la
            mejor experiencia de principio a fin.
          </p>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-white/5 bg-slate-800/50 p-8 backdrop-blur-sm transition-all hover:border-cyan-400/20 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-cyan-500/5"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20 text-cyan-400 transition-colors group-hover:from-cyan-400/30 group-hover:to-blue-600/30">
                  <feature.icon size={24} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
