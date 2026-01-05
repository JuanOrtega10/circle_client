'use client'

import { useState, useEffect } from 'react'
import CredentialsPanel from '../components/CredentialsPanel'
import APIExplorer from '../components/APIExplorer'
import { parseOpenAPISpec } from '../utils/openapiParser'

export default function Home() {
  const [credentials, setCredentials] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('circle_credentials')
      return saved ? JSON.parse(saved) : { token: '', host: '' }
    }
    return { token: '', host: '' }
  })
  const [apiSpec, setApiSpec] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadAPISpec()
  }, [])

  const loadAPISpec = async () => {
    try {
      setLoading(true)
      setError(null)
      const spec = await parseOpenAPISpec('/swagger.yaml')
      setApiSpec(spec)
    } catch (err) {
      setError(`Error loading API spec: ${err.message}`)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCredentialsChange = (newCredentials) => {
    setCredentials(newCredentials)
    if (typeof window !== 'undefined') {
      localStorage.setItem('circle_credentials', JSON.stringify(newCredentials))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando especificación de API...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadAPISpec}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Circle.so Admin API Client</h1>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <CredentialsPanel
          credentials={credentials}
          onCredentialsChange={handleCredentialsChange}
        />
        
        {apiSpec && (
          <APIExplorer
            apiSpec={apiSpec}
            credentials={credentials}
          />
        )}
      </div>
    </div>
  )
}

