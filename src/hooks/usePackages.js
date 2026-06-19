import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Fetches packages for a specific destination.
 * Columns: id, destination_id, title, price, duration_days, is_all_inclusive, Detalles, created_at
 */
export function usePackages(destinationId) {
  const [packages, setPackages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!destinationId) return
    fetchPackages()
  }, [destinationId])

  async function fetchPackages() {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: supabaseError } = await supabase
        .from('packages')
        .select('*')
        .eq('destination_id', destinationId)
        .order('created_at', { ascending: false })

      if (supabaseError) throw supabaseError

      setPackages(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error fetching packages:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return { packages, isLoading, error, refetch: fetchPackages }
}

/**
 * Fetches a single package by ID, including its parent destination.
 */
export function usePackage(id) {
  const [pkg, setPkg] = useState(null)
  const [destination, setDestination] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
    fetchPackage()
  }, [id])

  async function fetchPackage() {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch the package
      const { data: pkgData, error: pkgErr } = await supabase
        .from('packages')
        .select('*')
        .eq('id', id)
        .single()

      if (pkgErr) throw pkgErr

      setPkg(pkgData)

      // Fetch the parent destination for context
      if (pkgData?.destination_id) {
        const { data: destData } = await supabase
          .from('destinations')
          .select('*')
          .eq('id', pkgData.destination_id)
          .single()

        setDestination(destData)
      }
    } catch (err) {
      setError(err.message)
      console.error('Error fetching package:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return { pkg, destination, isLoading, error }
}
