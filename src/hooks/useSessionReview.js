// Fetches pending session reviews from Supabase
// These are generated automatically by the Strava webhook
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useSessionReview() {
  const { user }              = useAuth()
  const [review,  setReview]  = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchLatestReview()

    // Listen for new reviews in real time (Supabase Realtime)
    const channel = supabase
      .channel('session_reviews')
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'session_reviews',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        setReview(normalizeReview(payload.new))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user])

  async function fetchLatestReview() {
    setLoading(true)
    const { data } = await supabase
      .from('session_reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('seen', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (data) setReview(normalizeReview(data))
    setLoading(false)
  }

  async function markSeen(reviewId) {
    await supabase.from('session_reviews').update({ seen: true }).eq('id', reviewId)
    setReview(null)
  }

  function normalizeReview(r) {
    return {
      ...r,
      blocks: typeof r.blocks === 'string' ? JSON.parse(r.blocks) : r.blocks || [],
    }
  }

  return { review, loading, markSeen }
}
