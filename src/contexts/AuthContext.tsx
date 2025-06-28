// src/contexts/AuthContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as AuthUser } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'
import { User, Company } from '@/types/database'
import { userService } from '@/lib/services'
import { setupSupabaseErrorInterceptor } from '@/utils/supabase/error-interceptor'

interface AuthContextType {
  authUser: AuthUser | null
  user: User | null
  company: Company | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Configurar interceptor de errores de Supabase
    if (typeof window !== 'undefined') {
      setupSupabaseErrorInterceptor()
    }

    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          // Si hay error de token, limpiar la sesión
          if (error.message?.includes('refresh_token_not_found') || error.message?.includes('Invalid Refresh Token')) {
            await supabase.auth.signOut()
            setAuthUser(null)
            setUser(null)
            setCompany(null)
            setLoading(false)
            return
          }
        }
        
        setAuthUser(session?.user ?? null)
        
        if (session?.user) {
          await loadUserData(session.user.id)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error getting initial session:', error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setAuthUser(null)
          setUser(null)
          setCompany(null)
          setLoading(false)
          return
        }
        
        setAuthUser(session?.user ?? null)
        
        if (session?.user) {
          await loadUserData(session.user.id)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const createUserProfile = async (userId: string) => {
    try {
      // Obtener información del usuario de auth
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) return

      // Crear perfil en la tabla users
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: authUser.email!,
          full_name: authUser.user_metadata?.full_name || null,
          role: 'user', // rol por defecto
          is_active: true
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating user profile:', error)
        return
      }

      setUser(data)
    } catch (error) {
      console.error('Error in createUserProfile:', error)
    }
  }

  const loadUserData = async (userId: string) => {
    try {
      // Cargar datos del usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) {
        // Si el usuario no existe en la tabla users, crearlo
        if (userError.code === 'PGRST116') { // No rows returned
          await createUserProfile(userId)
          return
        }
        console.error('Error loading user data:', userError)
        return
      }

      setUser(userData)

      // Cargar datos de la compañía si el usuario tiene una
      if (userData.company_id) {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', userData.company_id)
          .single()


        if (!companyError && companyData) {
          setCompany(companyData)
        }
      }
    } catch (error) {
      console.error('Error in loadUserData:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      return { error }
    } catch (error) {
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })

      if (error) return { error }

      // Si el usuario se registra exitosamente, crear su perfil en la tabla users
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            full_name: fullName || null,
            role: 'user', // rol por defecto
            is_active: true
          })

        if (profileError) {
          console.error('Error creating user profile:', profileError)
        }
      }

      return { error: null }
    } catch (error) {
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signOut()
      
      if (!error) {
        setAuthUser(null)
        setUser(null)
        setCompany(null)
      }
      
      return { error }
    } catch (error) {
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    if (authUser) {
      await loadUserData(authUser.id)
    }
  }

  const value: AuthContextType = {
    authUser,
    user,
    company,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}