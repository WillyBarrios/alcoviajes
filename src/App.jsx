import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import Destinos from './pages/Destinos'
import DestinoDetalle from './pages/DestinoDetalle'
import PaqueteDetalle from './pages/PaqueteDetalle'
import DashboardUsuario from './pages/DashboardUsuario'
import AdminDashboard from './pages/AdminDashboard'

function ClientLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Client Routes with Navbar and Footer */}
          <Route element={<ClientLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/destinos" element={<Destinos />} />
            <Route path="/destinos/:id" element={<DestinoDetalle />} />
            <Route path="/paquete/:id" element={<PaqueteDetalle />} />
            <Route path="/dashboard" element={<DashboardUsuario />} />
          </Route>

          {/* Admin Route - Completely independent layout */}
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

