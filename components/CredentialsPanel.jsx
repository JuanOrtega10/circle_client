import { useState } from 'react'
import { makeRequest } from '../utils/apiClient'

function CredentialsPanel({ credentials, onCredentialsChange }) {
  const [token, setToken] = useState(credentials.token || '')
  const [host, setHost] = useState(credentials.host || '')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const handleSave = () => {
    onCredentialsChange({ token, host })
    setTestResult(null)
  }

  const handleTestConnection = async () => {
    if (!token || !host) {
      setTestResult({
        success: false,
        message: 'Por favor completa token y host'
      })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      // Try a simple endpoint to test connection
      // Using a common endpoint like getting community details
      const testUrl = `${host}/api/admin/v2/community`
      const response = await makeRequest('GET', testUrl, { token, host })

      if (response.error) {
        setTestResult({
          success: false,
          message: `Error ${response.status}: ${response.data?.message || JSON.stringify(response.data)}`,
          error: response.data
        })
      } else {
        setTestResult({
          success: true,
          message: 'Conexión exitosa',
          data: response.data
        })
        
        // Auto-save on successful test
        onCredentialsChange({ token, host })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error de conexión: ${error.message}`,
        error: error.message
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Credenciales</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Token
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Token AUTH_TOKEN"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Host
          </label>
          <input
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="https://your-circle-instance.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Guardar
          </button>
          <button
            onClick={handleTestConnection}
            disabled={testing || !token || !host}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {testing && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Probar Conexión
          </button>
        </div>

        {testResult && (
          <div className={`p-4 rounded-lg ${
            testResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-2">
              {testResult.success ? (
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <div className="flex-1">
                <p className={`font-medium ${
                  testResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {testResult.message}
                </p>
                {testResult.data && (
                  <pre className="mt-2 text-xs text-green-700 overflow-auto max-h-96 bg-white p-3 rounded border border-green-200">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                )}
                {testResult.error && (
                  <pre className="mt-2 text-xs text-red-700 overflow-auto max-h-96 bg-white p-3 rounded border border-red-200">
                    {JSON.stringify(testResult.error, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CredentialsPanel

