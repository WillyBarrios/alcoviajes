import { Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()}{' '}
            <span className="font-semibold text-white">Alcoviajes</span>. Todos
            los derechos reservados.
          </p>
          <p className="flex items-center gap-1 text-sm text-slate-500">
            Hecho con <Heart size={14} className="text-red-400" /> en Guatemala
          </p>
        </div>
      </div>
    </footer>
  )
}
