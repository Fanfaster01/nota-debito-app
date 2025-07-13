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
import { handleServiceError } from '@/utils/errorHandler'

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
          throw new Error(handleServiceError(error, 'Error al iniciar sesión'))
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
          throw new Error(handleServiceError(error, 'Error al registrarse'))
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50">
      <div className="flex min-h-screen">
        {/* Panel izquierdo con logos e información */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-12 bg-gradient-to-br from-red-600 to-red-800">
          <div className="text-center space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Sistema de Gestión Empresarial
              </h1>
              <p className="text-xl text-red-100 mb-8">
                Control de cajas, cuentas por pagar, notas de débito y más
              </p>
            </div>
            
            {/* Logos de las empresas */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center justify-center h-24">
                <img src="/logos/LA VICTORIANA LOGO.png" alt="La Victoriana" className="max-h-16 max-w-full object-contain" />
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center justify-center h-24">
                <img src="/logos/BÚNKER RESTAURANT LOGO.svg" alt="Búnker Restaurant" className="max-h-16 max-w-full object-contain filter invert" />
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center justify-center h-24">
                <img src="/logos/MICHI BURGER LOGO.svg" alt="Michi Burger" className="max-h-16 max-w-full object-contain" />
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center justify-center h-24">
                <img src="/logos/MICHI PIZZA LOGO.svg" alt="Michi Pizza" className="max-h-16 max-w-full object-contain" />
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-red-100 text-sm">
                Trusted by leading restaurant chains
              </p>
            </div>
          </div>
        </div>

        {/* Panel derecho con formulario */}
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-md">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-red-600 p-3 rounded-full">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900">
                {isSignUp ? 'Crear cuenta' : 'Bienvenido'}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {isSignUp ? 'Registra tu cuenta para comenzar' : 'Inicia sesión en tu cuenta'}
              </p>
            </div>

            {/* Mensajes de error y éxito */}
            {(loginState.error || signUpState.error) && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-600 text-sm">{loginState.error || signUpState.error}</p>
                </div>
              </div>
            )}

            {message && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-green-600 text-sm">{message}</p>
                </div>
              </div>
            )}

            <div className="mt-8">
              <Card className="p-8 shadow-xl border-0">
                {!isSignUp ? (
                  // Formulario de Login
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <Input
                        label="Email"
                        type="email"
                        className="pl-10"
                        {...loginForm.register('email')}
                        error={loginForm.formState.errors.email?.message}
                        disabled={loading || loginState.loading}
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <Input
                        label="Contraseña"
                        type="password"
                        className="pl-10"
                        {...loginForm.register('password')}
                        error={loginForm.formState.errors.password?.message}
                        disabled={loading || loginState.loading}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          id="remember-me"
                          name="remember-me"
                          type="checkbox"
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                          Recordar sesión
                        </label>
                      </div>

                      <div className="text-sm">
                        <a href="#" className="font-medium text-red-600 hover:text-red-500">
                          ¿Olvidaste tu contraseña?
                        </a>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-red-600 hover:bg-red-700 focus:ring-red-500"
                      disabled={loading || loginState.loading}
                    >
                      {(loading || loginState.loading) ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Iniciando sesión...
                        </div>
                      ) : (
                        'Iniciar sesión'
                      )}
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
                        className="text-red-600 hover:text-red-500 text-sm font-medium"
                        disabled={loading || loginState.loading}
                      >
                        ¿No tienes cuenta? Regístrate aquí
                      </button>
                    </div>
                  </form>
                ) : (
                  // Formulario de Registro
                  <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-6">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <Input
                        label="Nombre completo"
                        type="text"
                        className="pl-10"
                        {...signUpForm.register('fullName')}
                        error={signUpForm.formState.errors.fullName?.message}
                        disabled={loading || signUpState.loading}
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <Input
                        label="Email"
                        type="email"
                        className="pl-10"
                        {...signUpForm.register('email')}
                        error={signUpForm.formState.errors.email?.message}
                        disabled={loading || signUpState.loading}
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <Input
                        label="Contraseña"
                        type="password"
                        className="pl-10"
                        {...signUpForm.register('password')}
                        error={signUpForm.formState.errors.password?.message}
                        disabled={loading || signUpState.loading}
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <Input
                        label="Confirmar contraseña"
                        type="password"
                        className="pl-10"
                        {...signUpForm.register('confirmPassword')}
                        error={signUpForm.formState.errors.confirmPassword?.message}
                        disabled={loading || signUpState.loading}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-red-600 hover:bg-red-700 focus:ring-red-500"
                      disabled={loading || signUpState.loading}
                    >
                      {(loading || signUpState.loading) ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Registrando...
                        </div>
                      ) : (
                        'Registrarse'
                      )}
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
                        className="text-red-600 hover:text-red-500 text-sm font-medium"
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
        </div>
      </div>
    </div>
  )
}