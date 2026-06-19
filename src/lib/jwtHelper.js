/**
 * Decodifica de forma segura la carga útil (payload) de un JWT.
 * @param {string} token - El JWT a decodificar.
 * @returns {object|null} La carga útil decodificada o null si el token no es válido.
 */
export function decodeJWT(token) {
  if (!token || typeof token !== 'string') return null

  const parts = token.split('.')
  if (parts.length !== 3) {
    return null // Un JWT válido debe tener 3 partes (header, payload, signature)
  }

  try {
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    
    // Decodifica la cadena base64 teniendo en cuenta caracteres UTF-8
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Error al decodificar JWT:', error)
    return null
  }
}

/**
 * Verifica si un token JWT ha expirado.
 * @param {string} token - El JWT a verificar.
 * @returns {boolean} true si ha expirado o es inválido, false en caso contrario.
 */
export function isTokenExpired(token) {
  const payload = decodeJWT(token)
  if (!payload || !payload.exp) {
    return true
  }

  // payload.exp está en segundos, Date.now() está en milisegundos
  const currentTime = Math.floor(Date.now() / 1000)
  return payload.exp < currentTime
}

/**
 * Valida la estructura básica y la expiración de un token JWT de Supabase.
 * @param {string} token - El JWT a validar.
 * @returns {boolean} true si es válido y está vigente, false en caso contrario.
 */
export function validateSessionToken(token) {
  if (!token) return false
  
  const payload = decodeJWT(token)
  if (!payload) return false

  // Validaciones adicionales específicas de Supabase
  if (payload.iss && !payload.iss.includes('supabase.co')) {
    // Si iss existe, debe ser de supabase.co
    console.warn('Emisor de JWT no es de Supabase:', payload.iss)
  }

  const isExpired = isTokenExpired(token)
  return !isExpired
}
