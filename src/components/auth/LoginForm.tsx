// src/components/auth/LoginForm.tsx
'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAsyncForm } from '@/hooks/useAsyncState'

const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'El email es requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

const signUpSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'El email es requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirmar contraseña es requerido'),
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

type LoginFormData = z.infer<typeof loginSchema>
type SignUpFormData = z.infer<typeof signUpSchema>

export function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const { signIn, signUp, loading } = useAuth()
  
  // Estados unificados con useAsyncForm
  const loginState = useAsyncForm<void>()
  const signUpState = useAsyncForm<void>()

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
    },
  })

  const handleLogin = async (data: LoginFormData) => {
    setMessage(null)
    
    await loginState.executeWithValidation(
      async () => {
        const { error } = await signIn(data.email, data.password)
        if (error) {
          throw new Error(error.message || 'Error al iniciar sesión')
        }
        return void 0
      },
      'Error al iniciar sesión'
    )
  }

  const handleSignUp = async (data: SignUpFormData) => {
    setMessage(null)
    
    const result = await signUpState.executeWithValidation(
      async () => {
        const { error } = await signUp(data.email, data.password, data.fullName)
        if (error) {
          throw new Error(error.message || 'Error al registrarse')
        }
        return void 0
      },
      'Error al registrarse'
    )
    
    if (result !== null) {
      setMessage('¡Registro exitoso! Verifica tu email para confirmar tu cuenta.')
      setIsSignUp(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Generador de Notas de Débito por Diferencial Cambiario
          </p>
        </div>

        {/* Mensajes de error y éxito */}
        {(loginState.error || signUpState.error) && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{loginState.error || signUpState.error}</p>
          </div>
        )}

        {message && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-600 text-sm">{message}</p>
          </div>
        )}

        <Card>
          {!isSignUp ? (
            // Formulario de Login
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
              <Input
                label="Email"
                type="email"
                {...loginForm.register('email')}
                error={loginForm.formState.errors.email?.message}
                disabled={loading || loginState.loading}
              />

              <Input
                label="Contraseña"
                type="password"
                {...loginForm.register('password')}
                error={loginForm.formState.errors.password?.message}
                disabled={loading || loginState.loading}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={loading || loginState.loading}
              >
                {(loading || loginState.loading) ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true)
                    loginState.clearError()
                    signUpState.clearError()
                    setMessage(null)
                  }}
                  className="text-blue-600 hover:text-blue-500 text-sm"
                  disabled={loading || loginState.loading}
                >
                  ¿No tienes cuenta? Regístrate aquí
                </button>
              </div>
            </form>
          ) : (
            // Formulario de Registro
            <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-6">
              <Input
                label="Nombre completo"
                type="text"
                {...signUpForm.register('fullName')}
                error={signUpForm.formState.errors.fullName?.message}
                disabled={loading || signUpState.loading}
              />

              <Input
                label="Email"
                type="email"
                {...signUpForm.register('email')}
                error={signUpForm.formState.errors.email?.message}
                disabled={loading || signUpState.loading}
              />

              <Input
                label="Contraseña"
                type="password"
                {...signUpForm.register('password')}
                error={signUpForm.formState.errors.password?.message}
                disabled={loading || signUpState.loading}
              />

              <Input
                label="Confirmar contraseña"
                type="password"
                {...signUpForm.register('confirmPassword')}
                error={signUpForm.formState.errors.confirmPassword?.message}
                disabled={loading || signUpState.loading}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={loading || signUpState.loading}
              >
                {(loading || signUpState.loading) ? 'Registrando...' : 'Registrarse'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false)
                    loginState.clearError()
                    signUpState.clearError()
                    setMessage(null)
                  }}
                  className="text-blue-600 hover:text-blue-500 text-sm"
                  disabled={loading || signUpState.loading}
                >
                  ¿Ya tienes cuenta? Inicia sesión aquí
                </button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}