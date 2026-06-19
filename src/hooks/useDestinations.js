import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Fetches all destinations from Supabase.
 * Columns: id, name, country, description, hero_image_url, created_at
 */
export function useDestinations() {
  const [destinations, setDestinations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDestinations()
  }, [])

  async function fetchDestinations() {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: supabaseError } = await supabase
        .from('destinations')
        .select('*')
        .order('created_at', { ascending: false })

      if (supabaseError) throw supabaseError

      setDestinations(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error fetching destinations:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return { destinations, isLoading, error, refetch: fetchDestinations }
}

/**
 * Fetches a single destination by ID.
 */
export function useDestination(id) {
  const [destination, setDestination] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
    fetchDestination()
  }, [id])

  async function fetchDestination() {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: supabaseError } = await supabase
        .from('destinations')
        .select('*')
        .eq('id', id)
        .single()

      if (supabaseError) throw supabaseError

      setDestination(data)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching destination:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return { destination, isLoading, error }
}
