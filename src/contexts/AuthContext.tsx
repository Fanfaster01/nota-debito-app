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
  signIn: (email: string, password: string) => Promise<{ error: unknown }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: unknown }>
  signOut: () => Promise<{ error: unknown }>
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
      console.log('[Auth] Iniciando verificación de sesión...')
      
      // Timeout de seguridad - si toma más de 10 segundos, continuar sin sesión
      const timeoutId = setTimeout(() => {
        console.error('[Auth] Timeout al verificar sesión - continuando sin autenticación')
        setAuthUser(null)
        setUser(null)
        setCompany(null)
        setLoading(false)
      }, 10000)
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('[Auth] Error de sesión:', error)
          // Si hay error de token, limpiar la sesión
          if (error.message?.includes('refresh_token_not_found') || error.message?.includes('Invalid Refresh Token')) {
            console.log('[Auth] Token inválido, limpiando sesión...')
            await supabase.auth.signOut()
            setAuthUser(null)
            setUser(null)
            setCompany(null)
            setLoading(false)
            clearTimeout(timeoutId)
            return
          }
          // Para cualquier otro error, también establecer loading en false
          setLoading(false)
          clearTimeout(timeoutId)
          return
        }
        
        console.log('[Auth] Sesión obtenida:', session?.user?.email)
        setAuthUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('[Auth] Cargando datos del usuario...')
          await loadUserData(session.user.id)
        }
        
        console.log('[Auth] Verificación de sesión completada')
        setLoading(false)
        clearTimeout(timeoutId)
      } catch (error) {
        console.error('[Auth] Error crítico al obtener sesión:', error)
        setAuthUser(null)
        setUser(null)
        setCompany(null)
        setLoading(false)
        clearTimeout(timeoutId)
      }
    }

    getInitialSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Auth state change:', event, session?.user?.email)
        
        if (event === 'SIGNED_OUT' || !session) {
          console.log('[Auth] Usuario desconectado')
          setAuthUser(null)
          setUser(null)
          setCompany(null)
          setLoading(false)
          return
        }
        
        console.log('[Auth] Usuario conectado, cargando datos...')
        setAuthUser(session?.user ?? null)
        
        if (session?.user) {
          await loadUserData(session.user.id)
        }
        
        console.log('[Auth] Auth state change completado')
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
    // Timeout para loadUserData también
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout loading user data')), 8000)
    })

    try {
      console.log('[Auth] Cargando datos para usuario:', userId)
      
      // Race entre la carga de datos y el timeout
      await Promise.race([
        (async () => {
          // Cargar datos del usuario
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()

          if (userError) {
            console.error('[Auth] Error al cargar usuario:', userError)
            // Si el usuario no existe en la tabla users, crearlo
            if (userError.code === 'PGRST116') { // No rows returned
              console.log('[Auth] Usuario no existe, creando perfil...')
              await createUserProfile(userId)
              return
            }
            return
          }

          console.log('[Auth] Usuario cargado:', userData.email)
          setUser(userData)

          // Cargar datos de la compañía si el usuario tiene una
          if (userData.company_id) {
            console.log('[Auth] Cargando compañía:', userData.company_id)
            const { data: companyData, error: companyError } = await supabase
              .from('companies')
              .select('*')
              .eq('id', userData.company_id)
              .single()

            if (!companyError && companyData) {
              console.log('[Auth] Compañía cargada:', companyData.name)
              setCompany(companyData)
            } else if (companyError) {
              console.error('[Auth] Error al cargar compañía:', companyError)
            }
          }
          
          console.log('[Auth] loadUserData completado exitosamente')
        })(),
        timeoutPromise
      ])
    } catch (error) {
      console.error('[Auth] Error crítico en loadUserData:', error)
      // No re-lanzar el error, solo loggearlo y continuar
      // Esto permite que la app continue funcionando aunque falle la carga de datos
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    console.log('[Auth] Iniciando signIn para:', email)
    
    // Timeout para signIn también
    const signInTimeout = setTimeout(() => {
      console.error('[Auth] Timeout en signIn - forzando loading false')
      setLoading(false)
    }, 15000)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      clearTimeout(signInTimeout)
      
      if (error) {
        console.error('[Auth] Error en signIn:', error)
        setLoading(false)
      }
      // Si no hay error, onAuthStateChange manejará el loading
      
      return { error }
    } catch (error) {
      console.error('[Auth] Error crítico en signIn:', error)
      clearTimeout(signInTimeout)
      setLoading(false)
      return { error }
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