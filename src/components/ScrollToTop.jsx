import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scrolls to top whenever the route changes.
 * Place inside <BrowserRouter> to work globally.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
