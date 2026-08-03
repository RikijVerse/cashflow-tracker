import { useEffect, useState } from 'react'
import type { Category, Wallet } from '../lib/types'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useCategories(type?: 'income' | 'expense' | 'all') {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    const q = type && type !== 'all'
      ? supabase.from('categories').select('id, name, icon, type').eq('type', type).order('name')
      : supabase.from('categories').select('id, name, icon, type').order('name')

    q.then(({ data }) => {
      if (active) {
        setCategories((data as Category[]) ?? [])
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [type])

  return { categories, loading }
}

export function useWallets() {
  const { user } = useAuth()
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let active = true
    setLoading(true)
    supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
      .then(({ data }) => {
        if (active) {
          setWallets((data as Wallet[]) ?? [])
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [user])

  return { wallets, loading }
}
