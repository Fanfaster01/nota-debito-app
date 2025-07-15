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
import { LogoCarousel } from '@/components/auth/LogoCarousel'

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

const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'El email es requerido'),
})

type LoginFormData = z.infer<typeof loginSchema>
type SignUpFormData = z.infer<typeof signUpSchema>
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [isResetPassword, setIsResetPassword] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const { signIn, signUp, resetPassword, loading } = useAuth()
  
  // Estados unificados con useAsyncForm
  const loginState = useAsyncForm<void>()
  const signUpState = useAsyncForm<void>()
  const resetPasswordState = useAsyncForm<void>()

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

  const resetPasswordForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
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

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setMessage(null)
    
    const result = await resetPasswordState.executeWithValidation(
      async () => {
        const { error } = await resetPassword(data.email)
        if (error) {
          throw new Error(handleServiceError(error, 'Error al enviar email de recuperación'))
        }
        return void 0
      },
      'Error al enviar email de recuperación'
    )
    
    if (result !== null) {
      setMessage('Se ha enviado un email con instrucciones para recuperar tu contraseña.')
      setIsResetPassword(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50">
      <div className="flex min-h-screen">
        {/* Panel izquierdo con logos e información */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-12 relative overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900">
          {/* Efectos de fondo glassmorphism */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-96 h-96 bg-orange-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-40 right-20 w-96 h-96 bg-red-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-20 left-40 w-96 h-96 bg-amber-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
          </div>
          
          {/* Patrón de puntos sutil */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239CA3AF' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
          
          <div className="relative z-10 text-center space-y-8">
            <div className="space-y-6">
              {/* Badge minimalista */}
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white/80 text-sm font-medium">Enterprise Solution</span>
              </div>
              
              {/* Título con gradiente */}
              <h1 className="text-5xl font-bold mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-white">
                  Sistema de Gestión
                </span>
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 animate-gradient-x">
                  Empresarial
                </span>
              </h1>
              
              {/* Descripción mejorada */}
              <p className="text-xl text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                Control inteligente de <span className="text-white font-medium">cajas</span>, 
                <span className="text-white font-medium"> cuentas por pagar</span> y 
                <span className="text-white font-medium"> notas de débito</span> en tiempo real
              </p>
              
              {/* Features minimalistas */}
              <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Seguro</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Rápido</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>24/7</span>
                </div>
              </div>
            </div>
            
            {/* Carrusel de logos con fondo glass */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 via-transparent to-gray-900/50 -z-10 blur-xl"></div>
              <LogoCarousel />
            </div>
          </div>
        </div>

        {/* Panel derecho con formulario */}
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:w-[600px] lg:px-20 xl:px-24 relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-slate-50">
          {/* Efectos glassmorphism sutiles para el panel derecho */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-32 right-10 w-64 h-64 bg-slate-300/10 rounded-full mix-blend-multiply filter blur-3xl opacity-40"></div>
            <div className="absolute bottom-32 left-10 w-64 h-64 bg-gray-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-40"></div>
          </div>
          
          <div className="mx-auto w-full max-w-md relative z-10">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-full shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-800">
                {isResetPassword ? 'Recuperar contraseña' : isSignUp ? 'Crear cuenta' : 'Bienvenido'}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {isResetPassword 
                  ? 'Ingresa tu email para recibir instrucciones' 
                  : isSignUp 
                    ? 'Registra tu cuenta para comenzar' 
                    : 'Inicia sesión en tu cuenta'
                }
              </p>
            </div>

            {/* Mensajes de error y éxito */}
            {(loginState.error || signUpState.error || resetPasswordState.error) && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-600 text-sm">{loginState.error || signUpState.error || resetPasswordState.error}</p>
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
              <Card className="p-8 min-h-[650px] flex flex-col justify-center bg-white/80 backdrop-blur-sm shadow-xl shadow-gray-900/10 border border-white/20">
                {isResetPassword ? (
                  // Formulario de Reset Password
                  <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-6">
                    <div className="relative">
                      <Input
                        label="Email"
                        type="email"
                        className="pl-10"
                        {...resetPasswordForm.register('email')}
                        error={resetPasswordForm.formState.errors.email?.message}
                        disabled={loading || resetPasswordState.loading}
                      />
                      <div className="absolute top-8 left-0 pl-3 flex items-center pointer-events-none h-10">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 focus:ring-orange-500 shadow-lg"
                      disabled={loading || resetPasswordState.loading}
                    >
                      {(loading || resetPasswordState.loading) ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Enviando...
                        </div>
                      ) : (
                        'Enviar instrucciones'
                      )}
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setIsResetPassword(false)
                          setIsSignUp(false)
                          resetPasswordState.clearError()
                          setMessage(null)
                        }}
                        className="text-orange-600 hover:text-orange-500 text-sm font-medium"
                        disabled={loading || resetPasswordState.loading}
                      >
                        ← Volver al inicio de sesión
                      </button>
                    </div>
                  </form>
                ) : !isSignUp ? (
                  // Formulario de Login
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
                    <div className="relative">
                      <Input
                        label="Email"
                        type="email"
                        className="pl-10"
                        {...loginForm.register('email')}
                        error={loginForm.formState.errors.email?.message}
                        disabled={loading || loginState.loading}
                      />
                      <div className="absolute top-8 left-0 pl-3 flex items-center pointer-events-none h-10">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                    </div>

                    <div className="relative">
                      <Input
                        label="Contraseña"
                        type="password"
                        className="pl-10"
                        {...loginForm.register('password')}
                        error={loginForm.formState.errors.password?.message}
                        disabled={loading || loginState.loading}
                      />
                      <div className="absolute top-8 left-0 pl-3 flex items-center pointer-events-none h-10">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          id="remember-me"
                          name="remember-me"
                          type="checkbox"
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                          Recordar sesión
                        </label>
                      </div>

                      <div className="text-sm">
                        <button
                          type="button"
                          onClick={() => setIsResetPassword(true)}
                          className="font-medium text-orange-600 hover:text-orange-500"
                        >
                          ¿Olvidaste tu contraseña?
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 focus:ring-orange-500 shadow-lg"
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
                          setIsResetPassword(false)
                          loginState.clearError()
                          signUpState.clearError()
                          resetPasswordState.clearError()
                          setMessage(null)
                        }}
                        className="text-orange-600 hover:text-orange-500 text-sm font-medium"
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
                      <Input
                        label="Nombre completo"
                        type="text"
                        className="pl-10"
                        {...signUpForm.register('fullName')}
                        error={signUpForm.formState.errors.fullName?.message}
                        disabled={loading || signUpState.loading}
                      />
                      <div className="absolute top-8 left-0 pl-3 flex items-center pointer-events-none h-10">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>

                    <div className="relative">
                      <Input
                        label="Email"
                        type="email"
                        className="pl-10"
                        {...signUpForm.register('email')}
                        error={signUpForm.formState.errors.email?.message}
                        disabled={loading || signUpState.loading}
                      />
                      <div className="absolute top-8 left-0 pl-3 flex items-center pointer-events-none h-10">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                    </div>

                    <div className="relative">
                      <Input
                        label="Contraseña"
                        type="password"
                        className="pl-10"
                        {...signUpForm.register('password')}
                        error={signUpForm.formState.errors.password?.message}
                        disabled={loading || signUpState.loading}
                      />
                      <div className="absolute top-8 left-0 pl-3 flex items-center pointer-events-none h-10">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>

                    <div className="relative">
                      <Input
                        label="Confirmar contraseña"
                        type="password"
                        className="pl-10"
                        {...signUpForm.register('confirmPassword')}
                        error={signUpForm.formState.errors.confirmPassword?.message}
                        disabled={loading || signUpState.loading}
                      />
                      <div className="absolute top-8 left-0 pl-3 flex items-center pointer-events-none h-10">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 focus:ring-orange-500 shadow-lg"
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
                          setIsResetPassword(false)
                          loginState.clearError()
                          signUpState.clearError()
                          resetPasswordState.clearError()
                          setMessage(null)
                        }}
                        className="text-orange-600 hover:text-orange-500 text-sm font-medium"
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