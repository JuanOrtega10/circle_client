import { useState } from 'react'
import { buildRequestUrl } from '../utils/openapiParser'
import { makeRequest } from '../utils/apiClient'
import SchemaViewer from './SchemaViewer'

function EndpointCard({ endpoint, credentials, inGroup = false }) {
  const [expanded, setExpanded] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [response, setResponse] = useState(null)
  const [pathParams, setPathParams] = useState({})
  const [queryParams, setQueryParams] = useState({})
  const [bodyParams, setBodyParams] = useState({})
  const [copied, setCopied] = useState(false)

  const methodColors = {
    GET: 'bg-green-100 text-green-800',
    POST: 'bg-blue-100 text-blue-800',
    PUT: 'bg-yellow-100 text-yellow-800',
    PATCH: 'bg-orange-100 text-orange-800',
    DELETE: 'bg-red-100 text-red-800',
  }

  const initializeParams = () => {
    const pathParamsObj = {}
    const queryParamsObj = {}
    const bodyParamsObj = {}

    endpoint.parameters?.forEach(param => {
      // Solo usar valores por defecto explícitos del schema, no inicializar con valores vacíos
      const initialValue = param.schema?.default !== undefined ? param.schema.default : 
                          param.default !== undefined ? param.default : ''
      
      if (param.in === 'path') {
        pathParamsObj[param.name] = initialValue
      } else if (param.in === 'query') {
        queryParamsObj[param.name] = initialValue
      }
    })

    if (endpoint.requestBody?.content?.['application/json']?.schema?.properties) {
      const properties = endpoint.requestBody.content['application/json'].schema.properties
      
      Object.keys(properties).forEach(key => {
        const propSchema = properties[key]
        const propType = propSchema.type || 'string'
        
        // Solo usar valor por defecto explícito del schema, no inicializar con valores vacíos
        if (propSchema.default !== undefined) {
          bodyParamsObj[key] = propSchema.default
        } else {
          // Inicializar como null/undefined para que los campos estén vacíos y muestren placeholders
          bodyParamsObj[key] = null
        }
      })
    }

    setPathParams(pathParamsObj)
    setQueryParams(queryParamsObj)
    setBodyParams(bodyParamsObj)
  }

  const handleExpand = () => {
    if (!expanded) {
      initializeParams()
    }
    setExpanded(!expanded)
  }

  const handleExecute = async () => {
    if (!credentials.token || !credentials.host) {
      setResponse({
        error: true,
        message: 'Por favor configura las credenciales primero'
      })
      return
    }

    setExecuting(true)
    setResponse(null)

    try {
      const url = buildRequestUrl(credentials.host, endpoint.path, pathParams, queryParams)
      
      // Filtrar solo los campos que tienen valores (no null/undefined/empty string)
      const hasBody = Object.keys(bodyParams).length > 0 && 
        Object.values(bodyParams).some(v => v !== '' && v !== null && v !== undefined && v !== false)
      
      // Crear body solo con campos que tienen valores
      const body = hasBody ? Object.fromEntries(
        Object.entries(bodyParams).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
      ) : null
      const response = await makeRequest(endpoint.method, url, credentials, body)
      
      setResponse(response)
    } catch (error) {
      setResponse({
        status: 500,
        statusText: 'Error',
        headers: {},
        data: error.message,
        error: true
      })
    } finally {
      setExecuting(false)
    }
  }

  const getTypeLabel = (schema) => {
    const type = schema.type || 'string'
    
    if (type === 'array') {
      const itemsType = schema.items?.type || 'any'
      return `array[${itemsType}]`
    }
    
    if (type === 'object') {
      return 'object'
    }
    
    return type
  }

  const handleCopyResponse = async () => {
    if (!response) return
    
    const responseText = JSON.stringify(response.data, null, 2)
    try {
      await navigator.clipboard.writeText(responseText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error al copiar:', err)
    }
  }

  const renderParamInput = (name, value, onChange, required = false, schema = {}, paramDescription = null) => {
    const type = schema.type || 'string'
    const isTextarea = type === 'object' || type === 'array'
    const typeLabel = getTypeLabel(schema)
    const description = schema.description || paramDescription || ''
    const example = schema.example
    const enumValues = schema.enum
    const format = schema.format
    const defaultValue = schema.default
    
    // Mejorar placeholder según el formato
    const getFormatPlaceholder = () => {
      if (format === 'date-time') {
        return '2024-01-01T00:00:00Z'
      }
      if (format === 'date') {
        return '2024-01-01'
      }
      if (format === 'email') {
        return 'example@email.com'
      }
      if (format === 'uri' || format === 'url') {
        return 'https://example.com'
      }
      return null
    }
    
    const formatPlaceholder = getFormatPlaceholder()

    return (
      <div key={name} className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <label className="block text-sm font-medium text-gray-700">
            {name}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-mono rounded">
            {typeLabel}
            {enumValues && ` (enum)`}
          </span>
        </div>
        {description && (
          <p className="text-xs text-gray-500 mb-1.5">{description}</p>
        )}
        {isTextarea ? (
          <textarea
            value={value === null || value === undefined ? '' : (typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value))}
            onChange={(e) => {
              const inputValue = e.target.value
              if (inputValue === '') {
                onChange(null)
              } else {
                try {
                  const parsed = JSON.parse(inputValue)
                  onChange(parsed)
                } catch {
                  onChange(inputValue)
                }
              }
            }}
            placeholder={
              type === 'array' 
                ? (schema.items?.type === 'integer' ? '[1, 2, 3]' : (example ? JSON.stringify(example) : '[]'))
                : (example ? JSON.stringify(example, null, 2) : (
                    schema.properties 
                      ? JSON.stringify(Object.keys(schema.properties).reduce((acc, k) => ({ ...acc, [k]: '' }), {}), null, 2)
                      : (schema.additionalProperties ? '{"key": "value"}' : '{}')
                  ))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            rows={type === 'array' && schema.items?.type === 'integer' ? 2 : (schema.properties ? Math.min(Object.keys(schema.properties).length * 1.5 + 2, 8) : 4)}
          />
        ) : enumValues ? (
          <select
            value={value === null || value === undefined ? '' : value}
            onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Seleccionar...</option>
            {enumValues.map((enumValue) => (
              <option key={enumValue} value={enumValue}>
                {enumValue}
              </option>
            ))}
          </select>
        ) : type === 'boolean' ? (
          <select
            value={value === true || value === 'true' ? 'true' : value === false || value === 'false' ? 'false' : ''}
            onChange={(e) => onChange(e.target.value === '' ? null : (e.target.value === 'true' ? true : false))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Seleccionar...</option>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        ) : (
          <input
            type={
              format === 'email' ? 'email' :
              format === 'date-time' ? 'datetime-local' :
              format === 'date' ? 'date' :
              type === 'integer' || type === 'number' ? 'number' : 'text'
            }
            value={value === null || value === undefined ? '' : value}
            onChange={(e) => {
              const inputValue = e.target.value
              if (inputValue === '') {
                onChange(null)
              } else {
                onChange(type === 'integer' || type === 'number' ? Number(inputValue) : inputValue)
              }
            }}
            placeholder={formatPlaceholder || example?.toString() || (type === 'string' ? 'texto...' : '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>
    )
  }

  if (inGroup) {
    return (
      <div>
        {expanded ? (
          <div className="space-y-4">
            {endpoint.description && (
              <p className="text-sm text-gray-600">{endpoint.description}</p>
            )}

            <div className="space-y-4">
              {/* Path Parameters */}
              {Object.keys(pathParams).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Path Parameters</h4>
                  {endpoint.parameters
                    ?.filter(p => p.in === 'path')
                    .map(param => {
                      const schema = param.schema || {}
                      return renderParamInput(
                        param.name,
                        pathParams[param.name] || '',
                        (value) => setPathParams({ ...pathParams, [param.name]: value }),
                        param.required,
                        schema,
                        param.description
                      )
                    })}
                </div>
              )}

              {/* Query Parameters */}
              {Object.keys(queryParams).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Query Parameters</h4>
                  {endpoint.parameters
                    ?.filter(p => p.in === 'query')
                    .map(param => {
                      const schema = param.schema || {}
                      return renderParamInput(
                        param.name,
                        queryParams[param.name] || '',
                        (value) => setQueryParams({ ...queryParams, [param.name]: value }),
                        param.required,
                        schema,
                        param.description
                      )
                    })}
                </div>
              )}

              {/* Request Body */}
              {Object.keys(bodyParams).length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900">Request Body</h4>
                    {endpoint.requestBody?.content?.['application/json']?.schema && (
                      <SchemaViewer
                        schema={endpoint.requestBody.content['application/json'].schema}
                        title="Ver Schema"
                      />
                    )}
                  </div>
                  {Object.entries(endpoint.requestBody?.content?.['application/json']?.schema?.properties || {}).map(([key, schema]) => {
                    const required = endpoint.requestBody?.content?.['application/json']?.schema?.required?.includes(key) || false
                    const currentValue = bodyParams[key]
                    
                    return renderParamInput(
                      key,
                      currentValue,
                      (value) => {
                        setBodyParams({ ...bodyParams, [key]: value })
                      },
                      required,
                      schema
                    )
                  })}
                </div>
              )}

              {/* Execute Button */}
              <button
                onClick={handleExecute}
                disabled={executing || !credentials.token || !credentials.host}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {executing && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {executing ? 'Ejecutando...' : 'Ejecutar Request'}
              </button>

              {/* Response */}
              {response && (
                <div className={`p-4 rounded-lg border ${
                  response.error
                    ? 'bg-red-50 border-red-200'
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold">
                      {response.error ? 'Error Response' : 'Success Response'}
                    </h4>
                    <div className="flex items-center gap-2">
                      {response.status && (
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          response.status >= 200 && response.status < 300
                            ? 'bg-green-200 text-green-800'
                            : 'bg-red-200 text-red-800'
                        }`}>
                          {response.status} {response.statusText}
                        </span>
                      )}
                      <button
                        onClick={handleCopyResponse}
                        className="p-1.5 hover:bg-white rounded transition-colors group"
                        title="Copiar respuesta"
                      >
                        {copied ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                </div>
                <pre className="text-xs overflow-auto max-h-96 bg-white p-3 rounded border border-gray-200">
                  {JSON.stringify(response.data, null, 2)}
                </pre>
                {response.status && endpoint.responses && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    {(() => {
                      const statusKey = String(response.status)
                      const responseSchema = endpoint.responses[statusKey]?.content?.['application/json']?.schema ||
                                             endpoint.responses[`${Math.floor(response.status / 100)}xx`]?.content?.['application/json']?.schema ||
                                             endpoint.responses['default']?.content?.['application/json']?.schema
                      return responseSchema ? (
                        <SchemaViewer
                          schema={responseSchema}
                          title="Ver Schema de Response"
                        />
                      ) : null
                    })()}
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        ) : (
          <button
            onClick={handleExpand}
            className="w-full text-left p-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
          >
            Ver detalles y ejecutar →
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div
        className="p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
        onClick={handleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${methodColors[endpoint.method] || 'bg-gray-100 text-gray-800'}`}>
              {endpoint.method}
            </span>
            <span className="font-mono text-sm text-gray-900 truncate">{endpoint.path}</span>
            <span className="text-sm text-gray-600 truncate">{endpoint.summary}</span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="p-4 bg-white border-t border-gray-200">
          {endpoint.description && (
            <p className="text-sm text-gray-600 mb-4">{endpoint.description}</p>
          )}

          <div className="space-y-4">
            {/* Path Parameters */}
            {Object.keys(pathParams).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Path Parameters</h4>
                {endpoint.parameters
                  ?.filter(p => p.in === 'path')
                  .map(param => {
                    const schema = param.schema || {}
                    return renderParamInput(
                      param.name,
                      pathParams[param.name] || '',
                      (value) => setPathParams({ ...pathParams, [param.name]: value }),
                      param.required,
                      schema
                    )
                  })}
              </div>
            )}

            {/* Query Parameters */}
            {Object.keys(queryParams).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Query Parameters</h4>
                {endpoint.parameters
                  ?.filter(p => p.in === 'query')
                  .map(param => {
                    const schema = param.schema || {}
                    return renderParamInput(
                      param.name,
                      queryParams[param.name] || '',
                      (value) => setQueryParams({ ...queryParams, [param.name]: value }),
                      param.required,
                      schema
                    )
                  })}
              </div>
            )}

            {/* Request Body */}
            {Object.keys(bodyParams).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">Request Body</h4>
                  {endpoint.requestBody?.content?.['application/json']?.schema && (
                    <SchemaViewer
                      schema={endpoint.requestBody.content['application/json'].schema}
                      title="Ver Schema"
                    />
                  )}
                </div>
                {Object.entries(endpoint.requestBody?.content?.['application/json']?.schema?.properties || {}).map(([key, schema]) => {
                  const required = endpoint.requestBody?.content?.['application/json']?.schema?.required?.includes(key) || false
                  const currentValue = bodyParams[key]
                  
                  return renderParamInput(
                    key,
                    currentValue,
                    (value) => {
                      setBodyParams({ ...bodyParams, [key]: value })
                    },
                    required,
                    schema
                  )
                })}
              </div>
            )}

            {/* Execute Button */}
            <button
              onClick={handleExecute}
              disabled={executing || !credentials.token || !credentials.host}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {executing && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {executing ? 'Ejecutando...' : 'Ejecutar Request'}
            </button>

            {/* Response */}
            {response && (
              <div className={`p-4 rounded-lg border ${
                response.error
                  ? 'bg-red-50 border-red-200'
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">
                    {response.error ? 'Error Response' : 'Success Response'}
                  </h4>
                  <div className="flex items-center gap-2">
                    {response.status && (
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        response.status >= 200 && response.status < 300
                          ? 'bg-green-200 text-green-800'
                          : 'bg-red-200 text-red-800'
                      }`}>
                        {response.status} {response.statusText}
                      </span>
                    )}
                    <button
                      onClick={handleCopyResponse}
                      className="p-1.5 hover:bg-white rounded transition-colors group"
                      title="Copiar respuesta"
                    >
                      {copied ? (
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <pre className="text-xs overflow-auto max-h-96 bg-white p-3 rounded border border-gray-200">
                  {JSON.stringify(response.data, null, 2)}
                </pre>
                {response.status && endpoint.responses && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    {(() => {
                      const statusKey = String(response.status)
                      const responseSchema = endpoint.responses[statusKey]?.content?.['application/json']?.schema ||
                                             endpoint.responses[`${Math.floor(response.status / 100)}xx`]?.content?.['application/json']?.schema ||
                                             endpoint.responses['default']?.content?.['application/json']?.schema
                      return responseSchema ? (
                        <SchemaViewer
                          schema={responseSchema}
                          title="Ver Schema de Response"
                        />
                      ) : null
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default EndpointCard

