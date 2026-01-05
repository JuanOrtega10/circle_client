import { useState } from 'react'
import EndpointCard from './EndpointCard'

function EndpointGroup({ path, endpoints, credentials }) {
  const [expanded, setExpanded] = useState(false)

  const methodColors = {
    GET: 'bg-green-100 text-green-800',
    POST: 'bg-blue-100 text-blue-800',
    PUT: 'bg-yellow-100 text-yellow-800',
    PATCH: 'bg-orange-100 text-orange-800',
    DELETE: 'bg-red-100 text-red-800',
  }

  // Ordenar endpoints por método HTTP (GET, POST, PUT, PATCH, DELETE)
  const methodOrder = { GET: 1, POST: 2, PUT: 3, PATCH: 4, DELETE: 5 }
  const sortedEndpoints = [...endpoints].sort((a, b) => {
    return (methodOrder[a.method] || 99) - (methodOrder[b.method] || 99)
  })

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div
        className="p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="font-mono text-sm text-gray-900 truncate flex-1">{path}</span>
            <div className="flex gap-1 flex-wrap">
              {sortedEndpoints.map((endpoint) => (
                <span
                  key={endpoint.method}
                  className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                    methodColors[endpoint.method] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {endpoint.method}
                </span>
              ))}
            </div>
            <span className="text-sm text-gray-500 ml-2">
              ({sortedEndpoints.length} {sortedEndpoints.length === 1 ? 'método' : 'métodos'})
            </span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ml-2 ${
              expanded ? 'transform rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="space-y-6">
            {sortedEndpoints.map((endpoint, index) => (
              <div key={`${endpoint.method}-${index}`} className={index > 0 ? 'border-t border-gray-200 pt-6' : ''}>
                <div className="mb-3 flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    methodColors[endpoint.method] || 'bg-gray-100 text-gray-800'
                  }`}>
                    {endpoint.method}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{endpoint.summary}</span>
                </div>
                <EndpointCard endpoint={endpoint} credentials={credentials} inGroup={true} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default EndpointGroup

