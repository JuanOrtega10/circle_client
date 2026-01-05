import { useState, useMemo } from 'react'
import EndpointGroup from './EndpointGroup'

function APIExplorer({ apiSpec, credentials }) {
  const [selectedTag, setSelectedTag] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const tags = Object.keys(apiSpec.endpointsByTag).sort()

  const filteredEndpoints = selectedTag
    ? apiSpec.endpointsByTag[selectedTag] || []
    : apiSpec.allEndpoints

  const searchFilteredEndpoints = searchQuery
    ? filteredEndpoints.filter(endpoint => {
        const query = searchQuery.toLowerCase().trim()
        if (!query) return true
        
        const searchInPath = endpoint.path.toLowerCase().includes(query)
        const searchInSummary = endpoint.summary.toLowerCase().includes(query)
        const searchInDescription = endpoint.description.toLowerCase().includes(query)
        const searchInTags = endpoint.tags.some(tag => tag.toLowerCase().includes(query))
        const searchInMethod = endpoint.method.toLowerCase().includes(query)
        
        return searchInPath || searchInSummary || searchInDescription || searchInTags || searchInMethod
      })
    : filteredEndpoints

  // Agrupar endpoints por path
  const groupedEndpoints = useMemo(() => {
    const groups = {}
    searchFilteredEndpoints.forEach(endpoint => {
      if (!groups[endpoint.path]) {
        groups[endpoint.path] = []
      }
      groups[endpoint.path].push(endpoint)
    })
    return groups
  }, [searchFilteredEndpoints])

  const sortedPaths = Object.keys(groupedEndpoints).sort()

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Explorador de API</h2>
        
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar endpoints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              selectedTag === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos ({apiSpec.allEndpoints.length})
          </button>
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                selectedTag === tag
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tag} ({apiSpec.endpointsByTag[tag].length})
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {sortedPaths.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No se encontraron endpoints</p>
          </div>
        ) : (
          sortedPaths.map(path => (
            <EndpointGroup
              key={path}
              path={path}
              endpoints={groupedEndpoints[path]}
              credentials={credentials}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default APIExplorer

