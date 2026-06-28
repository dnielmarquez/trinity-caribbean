'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useState } from 'react'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const redirectToUrl = `${window.location.origin}/auth/callback?next=/login/update-password`
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectToUrl,
            })

            if (error) {
                setError(error.message)
                setLoading(false)
            } else {
                setSuccess(true)
                setLoading(false)
            }
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error inesperado')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
            <div className="max-w-md w-full">
                <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Recuperar Contraseña
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Ingresa tu correo electrónico para recibir un enlace de recuperación
                        </p>
                    </div>

                    {success ? (
                        <div className="space-y-6 text-center">
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-4 rounded-lg text-sm">
                                Hemos enviado un enlace de recuperación a tu correo electrónico. Por favor, revisa tu bandeja de entrada y la carpeta de correo no deseado (spam).
                            </div>
                            <Link
                                href="/login"
                                className="inline-block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                            >
                                Volver a Iniciar Sesión
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-6">
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                                >
                                    Correo Electrónico
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="usuario@example.com"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
                            </button>

                            <div className="text-center mt-4">
                                <Link
                                    href="/login"
                                    className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                >
                                    Volver a Iniciar Sesión
                                </Link>
                            </div>
                        </form>
                    )}
                </div>

                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
                    Sistema de Gestión de Mantenimiento v1.0
                </p>
            </div>
        </div>
    )
}
